---
title: "학습/측정 노트: Dice Loss, AdamW, CosineAnnealingLR, thop 순서"
date: 2026-01-20
tags: [Dice, AdamW, CosineAnnealingLR, thop]
---

# 학습/측정 노트: Dice Loss, AdamW, CosineAnnealingLR, thop 순서

세그멘테이션 실험을 하면서 “설계(모델 구조)”만큼 자주 흔들리는 게 **학습 설정**이었습니다. 여기서는 제가 정리해둔 설정/주의사항을 짧게 모아둡니다.

---

## Dice Loss(이진 세그멘테이션 기준)

Dice는 예측 마스크와 정답 마스크의 **겹침(overlap)** 을 직접 최적화하는 느낌이라, 클래스 불균형이 심할 때(배경이 훨씬 많을 때) 유리한 경우가 많습니다.

- 장점: 작은 객체/영역에 상대적으로 강함
- 단점: 구현/안정성(스무딩, threshold 등)에 민감할 수 있음

---

## Adam → AdamW

AdamW는 weight decay를 “Adam의 적응적 업데이트”와 분리(decoupled)한 방식이라, 종종 일반화가 더 안정적입니다.

- 참고: [Decoupled Weight Decay Regularization](https://arxiv.org/abs/1711.05101)

실험을 할 때는 lr과 weight_decay를 함께 조정해야 의미가 있어서, 보통은:

- lr을 조금 올리고
- weight_decay를 작은 값으로 두고

바로 성능을 비교해보는 편이었습니다.

---

## CosineAnnealingLR

고정 lr보다, cosine 스케줄이 수렴이 안정적으로 느껴질 때가 있습니다.

- `T_max=epochs`, `eta_min` 같은 값은 “학습 기간/초기 lr”과 같이 봐야 합니다.

---

## thop 사용 시 주의: 마지막에 실행

모델 FLOPs/Params를 계산할 때 `thop.profile()`을 쓰면 편하지만, 훅이 모델을 변경/오염시킬 수 있어서 이후 forward가 깨질 때가 있습니다.

그래서 저는 보통 아래 순서를 고정합니다.

1. 평가(evaluate)
2. 시각화(visualize)
3. **마지막에** 복잡도 측정(print_model_complexity / thop)

---

## 짧은 결론

모델 구조 최적화(예: decoder 경량화)와 학습 설정 최적화(AdamW+cosine, Dice 등)는 **같이** 봐야 하고, 측정 도구(thop)는 실험 파이프라인을 깨지 않도록 **항상 마지막**에 두는 게 안전했습니다.

