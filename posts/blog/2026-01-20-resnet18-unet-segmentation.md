---
title: ResNet18 + U-Net으로 세그멘테이션 모델 설계하기 (224 입력)
date: 2026-01-20
tags: [Segmentation, ResNet18, U-Net, PyTorch]
---

# ResNet18 + U-Net으로 세그멘테이션 모델 설계하기 (224 입력)

이번 글은 **ResNet18 encoder + U-Net 스타일 decoder** 조합으로 이진 세그멘테이션 모델을 구성할 때, “무엇을 어떤 이유로 그렇게 했는지”를 설계 관점에서 최대한 **재현 가능한 수준**으로 정리한 기록입니다.

이 글의 수치/결론(해상도 흐름, skip 정책, pooling 실험, FLOPs/Params, thop 주의사항 등)은 제가 정리해둔 `Agent.md`의 세션 로그를 기반으로 합니다.

참고로 ResNet과 U-Net의 원 아이디어는 아래 논문에서 시작했습니다.

- ResNet: [Deep Residual Learning for Image Recognition](https://arxiv.org/abs/1512.03385)
- U-Net: [U-Net: Convolutional Networks for Biomedical Image Segmentation](https://arxiv.org/abs/1505.04597)

---

## 목표

- **입력 해상도**: \(224 \times 224\)
- **출력**: \((N, 1, 224, 224)\) 형태의 확률 마스크(이진 세그멘테이션 가정)
- **핵심 전략**
  - Encoder는 ResNet18로 **견고한 feature 추출**
  - Decoder는 U-Net처럼 **업샘플 + skip(concat)** 으로 경계/디테일 복원
  - Decoder 연산량은 **DSConv**로 줄이기(경량화)

---

## 전체 구조 한 장 요약

Encoder(ResNet18)가 feature map을 단계적으로 줄이고, Decoder가 다시 키워서 최종 마스크를 냅니다.

- **Encoder 해상도 흐름**: \(224 \rightarrow 112 \rightarrow 56 \rightarrow 28 \rightarrow 14 \rightarrow 7\)
- **Decoder 해상도 흐름**: \(7 \rightarrow 14 \rightarrow 28 \rightarrow 56 \rightarrow 112 \rightarrow 224\)

이 흐름이 왜 중요한지 한 줄로 말하면: **연산량은 encoder에서 해상도를 줄이며 관리**하고, **성능(경계/디테일)은 decoder+skip으로 복원**하는 구도가 됩니다.

---

## Encoder: ResNet18에서 무엇을 가져오나? (해상도/채널 기준)

ResNet18은 크게 (1) 초기 stem, (2) residual stage(layer1~4)로 나뉩니다.

### 1) stem에서 early downsampling

- **stem(layer0)**: `conv1(stride=2) + bn + relu + maxpool(stride=2)`
  - 입력: (N, 3, 224, 224)
  - `conv1` 출력: (N, 64, 112, 112)
  - `maxpool` 출력: (N, 64, 56, 56)

즉 stem만 지나도 \(224 \rightarrow 56\)으로 **공간 해상도가 4배 축소**됩니다. 이건 maxpool 자체가 “연산을 많이 해서”가 아니라, **후속 레이어들이 더 작은 feature map에서 계산하도록 만드는 효과**가 커서 전체 FLOPs에 큰 영향을 줍니다.

### 2) stage별 출력(채널/해상도)

전형적인 ResNet18 stage 출력은 다음처럼 요약할 수 있습니다.

- layer1: 56×56, 64ch
- layer2: 28×28, 128ch
- layer3: 14×14, 256ch
- layer4: 7×7, 512ch

이 stage 출력들을 decoder에서 skip으로 다시 활용하게 됩니다.

---

## Decoder: U-Net 스타일로 “복원”을 어떻게 하나?

Decoder는 아래 패턴을 반복합니다.

1. **업샘플링**: bilinear upsample로 2배 확대
2. **skip 결합**: encoder의 같은(혹은 가까운) 해상도 feature를 **채널 방향 concat**
3. **refine**: DSConv 블록으로 concat된 feature를 정리(refine)

예시로 7→14 단계에서는:

- 업샘플(7→14)한 decoder feature
- encoder의 14×14 feature(e3)를 concat
- DSConv로 정리

이렇게 하면 **고수준 의미 정보(깊은 feature)** + **경계/디테일(얕은 feature)** 를 동시에 활용할 수 있습니다.

---

## Skip connection 정책(어디를 붙일까?)

`Agent.md` 기준으로 사용한 skip은 다음과 같습니다(“concat 방식”).

- 7→14 단계: skip = e3 (256, 14×14)
- 14→28 단계: skip = e2 (128, 28×28)
- 28→56 단계: skip = e1 (64, 56×56)
- 56→112 단계: skip = e0 (64, 112×112)
- 112→224 단계: skip 없음(마지막 refine만)

여기서 한 가지 함정이 있습니다.

### e0 해상도 함정(56×56 → 112×112)

`e0`는 stem을 지난 직후라 56×56인데, decoder의 56→112 단계에서 붙이려면 **e0를 2배 업샘플해서 112×112로 맞춰야** concat이 됩니다.

실제로 구현할 때는 아래처럼 “정확한 size로 맞추기”가 안전합니다.

- `F.interpolate(e0, scale_factor=2, ...)` 또는
- `F.interpolate(tensor, size=skip.shape[-2:], ...)` (mismatch 방어)

---

## 출력층과 활성화: 왜 Sigmoid인가?

이진 세그멘테이션이면 보통 채널을 1로 두고:

- 마지막에 `Conv2d(..., out_channels=1, kernel_size=1)`
- 출력에 `Sigmoid()`를 적용해 \([0, 1]\) 확률로 해석합니다.

다중 클래스 세그멘테이션이라면 보통 logits를 그대로 내고(softmax는 loss에서 처리) `CrossEntropyLoss`를 쓰는 쪽이 일반적입니다.

---

## 실수하기 쉬운 포인트(경험에서 자주 걸리는 것)

- **해상도 mismatch**: concat 전에 spatial 크기가 다르면 에러가 납니다.  
  - 방어적으로 `F.interpolate(..., size=skip.shape[-2:])`처럼 맞춰주는 습관이 좋습니다.
- **“maxpool 제거 = FLOPs 감소”는 항상 성립하지 않음**
  - MaxPool 자체는 가볍지만, 제거로 인해 feature map이 커지면 **후속 conv FLOPs가 증가**할 수 있습니다.
- **측정 도구(thop) 사용 순서**
  - `thop.profile()`이 모델에 훅을 달아 이후 실행이 꼬일 수 있어, **평가/시각화 후 마지막에** 실행하는 게 안전합니다.

---

## (보너스) 최적화 실험 로그가 말해준 것들

모델 구조에서 바로 손대기 쉬운 부분(decoder 채널, pooling, skip)을 실험했을 때 `Agent.md`에 정리된 결과는 아래처럼 요약됩니다.

### Pooling 순서 실험(요약)

| 설정 | FLOPs (GFLOPs) | Params (M) | Dice Score | 순위 |
|------|---------------|-----------|------------|------|
| 최적화 전 | 7.924 | 22.738 | 0.9084 | - |
| MAM | 7.660 | 22.598 | 0.9077 | 3위 |
| **MAA** ✅ | 7.660 | 22.598 | **0.9104** | 1위 |
| AAM | 7.661 | 22.598 | 0.9016 | 4위 |

### Skip 최적화 실험(요약)

| 설정 | FLOPs (GFLOPs) | Params (M) | Dice Score |
|------|---------------|-----------|------------|
| 기준(MAA + Decoder(180/90/45/45)) | 7.660 | 22.598 | 0.9104 |
| Decoder 감소(128/64/32/32) | 7.519 | 22.516 | 0.9067 |
| **Skip 제거(e0,e1 제거)** ✅ | 7.474 | 22.511 | 0.9090 |
| Concat→Add | 7.485 | 22.597 | 0.9075 |

여기서 인상 깊었던 결론은:

- **Pooling 순서(MAA)** 는 성능에 확실히 영향을 줄 수 있다.
- decoder 채널을 너무 줄이면 FLOPs는 줄지만 성능이 먼저 내려갈 수 있다.
- 의외로 **얕은 skip(e0,e1) 제거**가 FLOPs를 줄이면서도 성능을 크게 해치지 않을 수 있다(실험 기반).

---

## 마무리

이 구조는 “성능(복원력)”과 “효율(경량 decoder)” 사이에서 타협점을 잡기 좋은 기본기 조합이라고 생각합니다. 다음 글에서는 decoder 경량화에 핵심인 **DSConv**를 더 구체적으로(왜 decoder에 두는지, 어디가 병목인지) 정리합니다.

