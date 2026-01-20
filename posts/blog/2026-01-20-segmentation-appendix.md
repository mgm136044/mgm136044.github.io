---
title: "Appendix: 세그멘테이션 실험 로그/설정 요약 (Pooling, Skip, FLOPs/Params)"
date: 2026-01-20
tags: [Segmentation, Optimization, FLOPs, Dice]
---

# Appendix: 세그멘테이션 실험 로그/설정 요약 (Pooling, Skip, FLOPs/Params)

이 글은 블로그 본문에서 언급했던 **`Agent.md` 기반 실험 기록** 중, 공개해도 의미가 큰 “재현용 정보”만 추려서 정리한 Appendix입니다. (세션 규칙/지침/잡다한 로그는 제외)

---

## 모델/과제 맥락(요약)

- 입력 해상도: \(224 \times 224\)
- 구성: **ResNet18 encoder + U-Net 스타일 decoder**
- 다운샘플링: `conv1(stride=2) + maxpool(stride=2)`를 유지(early downsampling)
- decoder: refine 단계에 **DSConv** 적용
- skip: 기본은 U-Net처럼 **concat**

---

## 실험 1) Pooling 순서 실험 (MAM / MAA / AAM)

`layer0` 쪽 pooling 순서를 바꿔 성능과 연산량이 어떻게 변하는지 비교한 결과입니다.

| 설정 | FLOPs (GFLOPs) | Params (M) | Dice Score | 순위 |
|------|---------------|-----------|------------|------|
| **최적화 전** | 7.924 | 22.738 | 0.9084 | - |
| **MAM 순서** | 7.660 | 22.598 | 0.9077 | 3위 |
| **MAA 순서** ✅ | 7.660 | 22.598 | **0.9104** | 🥇 1위 |
| **AAM 순서** | 7.661 | 22.598 | 0.9016 | 4위 |

### 결론(요약)

- 이 실험에서는 **MAA(Max→Avg→Avg)** 가 가장 좋은 Dice를 기록했습니다.
- decoder 채널을 조정하는 것보다, pooling 순서가 성능에 더 직접적으로 영향을 주는 구간이 있었습니다.

---

## 실험 2) Skip connection 최적화 (e0/e1 제거, Concat→Add)

skip을 어디까지 사용할지(특히 얕은 skip) 조정했을 때 성능/연산량이 어떻게 변하는지 비교한 결과입니다.

| 단계 | 설정 | FLOPs (GFLOPs) | Params (M) | Dice Score | 변화 |
|------|------|---------------|-----------|------------|------|
| 1 | 기준: MAA + Decoder(180/90/45/45) | 7.660 | 22.598 | 0.9104 | 기준 |
| 2 | Decoder 감소: (128/64/32/32) | 7.519 | 22.516 | 0.9067 | -0.0037 |
| 3 | **Skip 제거**: e0, e1 제거 | 7.474 | 22.511 | 0.9090 | +0.0023 |
| 4 | Concat→Add (e0,e1 제거 + Add) | 7.485 | 22.597 | 0.9075 | -0.0015 |

### 결론(요약)

- **얕은 skip(e0,e1) 제거**가 FLOPs를 줄이면서도 Dice를 크게 해치지 않았습니다(이 실험 기준).
- Concat→Add는 1×1 conv 등의 오버헤드가 생기면서 이득이 크지 않았습니다.

---

## 최종 선택 설정(세션 최종 상태 요약)

아래는 `Agent.md`에 기록된 “최종 선택” 요약입니다.

- Decoder: `(128, 64, 32, 32)`
- Pooling: **MAA** (MaxPool → AvgPool → AvgPool)
- Skip: e3, e2만 사용 (e0, e1 제거), **concat 유지**
- Loss: **Dice Loss만 사용**(과제 조건)
- Optimizer: **AdamW** (`weight_decay=1e-4`)
- LR: **CosineAnnealingLR** (초기 lr=1e-3, `T_max=15`, `eta_min=1e-6`)
- Epochs: 15

### 최종 성능 비교(요약)

| 설정 | FLOPs (GFLOPs) | Params (M) | Dice Score |
|------|---------------|-----------|------------|
| 최적화 전 | 7.924 | 22.738 | 0.9084 |
| 최종(epochs=15, AdamW) | **7.474** | **22.511** | **0.9111** |

---

## 측정 팁: thop는 “마지막에”

`thop.profile()`이 모델을 수정할 수 있어, 평가/시각화 등을 먼저 끝내고 **마지막에** 복잡도(FLOPs/Params)를 측정하는 것을 원칙으로 잡았습니다.

