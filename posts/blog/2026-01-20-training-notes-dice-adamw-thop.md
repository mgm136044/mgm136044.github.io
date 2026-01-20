---
title: "학습/측정 노트: Dice Loss, AdamW, CosineAnnealingLR, thop 순서"
date: 2026-01-20
tags: [Dice, AdamW, CosineAnnealingLR, thop]
---

# 학습/측정 노트: Dice Loss, AdamW, CosineAnnealingLR, thop 순서

세그멘테이션 실험을 하면서 “설계(모델 구조)”만큼 자주 흔들리는 게 **학습 설정**이었습니다. 여기서는 `Agent.md`에 남겨둔 설정/주의사항/실험 결과를 바탕으로, 나중에 다시 실험을 재현할 수 있도록 조금 더 상세하게 정리합니다.

---

## Dice Loss(이진 세그멘테이션 기준)

Dice는 예측 마스크와 정답 마스크의 **겹침(overlap)** 을 직접 최적화하는 느낌이라, 클래스 불균형이 심할 때(배경이 훨씬 많을 때) 유리한 경우가 많습니다.

- 장점: 작은 객체/영역에 상대적으로 강함
- 단점: 구현/안정성(스무딩, threshold 등)에 민감할 수 있음

`Agent.md` 기준으로는, 한때 `0.4 * BCE + 0.4 * Dice + 0.2 * Focal` 조합을 시도했지만,
**과제 조건** 때문에 최종적으로는 **Dice Loss만 사용**하도록 정리되어 있습니다.

---

## Adam → AdamW

AdamW는 weight decay를 “Adam의 적응적 업데이트”와 분리(decoupled)한 방식이라, 종종 일반화가 더 안정적입니다.

- 참고: [Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101)

실험을 할 때는 lr과 weight_decay를 함께 조정해야 의미가 있어서, 보통은:

- lr을 조금 올리고
- weight_decay를 작은 값으로 두고

바로 성능을 비교해보는 편이었습니다.

`Agent.md`에 기록된 한 설정은 다음과 같습니다.

- optimizer: **AdamW**
- lr: **1e-3**
- weight_decay: **1e-4**

---

## CosineAnnealingLR

고정 lr보다, cosine 스케줄이 수렴이 안정적으로 느껴질 때가 있습니다.

- `T_max=epochs`, `eta_min` 같은 값은 “학습 기간/초기 lr”과 같이 봐야 합니다.

`Agent.md`에 기록된 스케줄링 설정 요약:

- scheduler: **CosineAnnealingLR**
- `T_max = epochs` (예: 15)
- `eta_min = 1e-6`

---

## thop 사용 시 주의: 마지막에 실행

모델 FLOPs/Params를 계산할 때 `thop.profile()`을 쓰면 편하지만, 훅이 모델을 변경/오염시킬 수 있어서 이후 forward가 깨질 때가 있습니다.

그래서 저는 보통 아래 순서를 고정합니다.

1. 평가(evaluate)
2. 시각화(visualize)
3. **마지막에** 복잡도 측정(print_model_complexity / thop)

`Agent.md`에 명시된 것처럼, `thop.profile()`이 모델을 수정할 수 있어서 **`print_model_complexity`는 마지막에 실행**하는 것을 원칙으로 잡았습니다.

---

## 실험 결과(요약): “바꿨더니 뭐가 달라졌나?”

`Agent.md`에는 여러 실험이 표로 정리되어 있는데, 여기서는 학습/측정 관점에서 중요한 결론만 옮깁니다.

### Pooling 순서 실험(요약)

| 설정 | FLOPs (GFLOPs) | Params (M) | Dice Score |
|------|---------------|-----------|------------|
| 최적화 전 | 7.924 | 22.738 | 0.9084 |
| **MAA** ✅ | 7.660 | 22.598 | **0.9104** |

### 최종 성능(요약)

- 최적화 전: FLOPs 7.924 / Params 22.738 / Dice 0.9084
- 최종(epochs=15, AdamW): **FLOPs 7.474 / Params 22.511 / Dice 0.9111**

---

## 짧은 결론

모델 구조 최적화(예: decoder 경량화)와 학습 설정 최적화(AdamW+cosine, Dice 등)는 **같이** 봐야 하고, 측정 도구(thop)는 실험 파이프라인을 깨지 않도록 **항상 마지막**에 두는 게 안전했습니다.

