---
title: ResNet18 + U-Net으로 세그멘테이션 모델 설계하기 (224 입력)
date: 2026-01-20
tags: [Segmentation, ResNet18, U-Net, PyTorch]
---

# ResNet18 + U-Net으로 세그멘테이션 모델 설계하기 (224 입력)

이번 글은 **ResNet18 encoder + U-Net 스타일 decoder** 조합으로 이진 세그멘테이션 모델을 구성할 때, “무엇을 어떤 이유로 그렇게 했는지”를 설계 관점에서 정리한 노트입니다.

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

---

## Encoder: ResNet18에서 무엇을 가져오나?

ResNet18은 크게 (1) 초기 stem, (2) residual stage(layer1~4)로 나뉩니다.

- **stem**: `conv1(stride=2) + bn + relu + maxpool(stride=2)`
  - 여기서 이미 \(224 \rightarrow 56\)으로 줄어들어, 뒤쪽 연산이 크게 가벼워집니다.
- **stage 출력 예시(전형적인 ResNet18)**  
  - layer1: 56×56, 64ch  
  - layer2: 28×28, 128ch  
  - layer3: 14×14, 256ch  
  - layer4: 7×7, 512ch  

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

## 마무리

이 구조는 “성능(복원력)”과 “효율(경량 decoder)” 사이에서 타협점을 잡기 좋은 기본기 조합이라고 생각합니다. 다음 글에서는 decoder 경량화에 핵심인 **DSConv**를 더 구체적으로 정리합니다.

