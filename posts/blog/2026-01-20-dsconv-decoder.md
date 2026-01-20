---
title: Decoder를 가볍게: DSConv(Depthwise Separable Conv) 적용 노트
date: 2026-01-20
tags: [Segmentation, DSConv, Optimization]
---

# Decoder를 가볍게: DSConv(Depthwise Separable Conv) 적용 노트

세그멘테이션에서 decoder는 업샘플 후 feature를 여러 번 “정리(refine)”해야 해서, 생각보다 연산이 쉽게 커집니다. 그래서 decoder 쪽에 **DSConv(Depthwise Separable Convolution)** 를 넣어 계산량을 줄이는 전략을 자주 씁니다.

---

## DSConv는 무엇이 다른가?

일반적인 3×3 Conv는 **공간 필터링 + 채널 믹싱**을 한 번에 합니다.

DSConv는 이걸 둘로 분리합니다.

1. **Depthwise 3×3**: 채널별로 따로 3×3을 적용 (`groups=in_channels`)
2. **Pointwise 1×1**: 1×1 conv로 채널을 섞고(out_channels로) 변환

결과적으로 **비슷한 표현력을 유지하면서** 파라미터/연산을 줄이는 방향으로 설계할 수 있습니다.

---

## “왜 encoder가 아니라 decoder에서 쓰나?”

제 기준으로는 아래 이유가 큽니다.

- **encoder는 표현력/일반화가 중요**: backbone은 검증된 구조(ResNet18)를 그대로 쓰는 편이 안전
- **decoder는 반복적인 3×3 refine가 많음**: 여기를 가볍게 만들면 전체 FLOPs에 체감이 큼
- **skip concat으로 채널이 늘어남**: concat 직후 3×3 conv가 무거워지기 쉬운데, DSConv가 특히 도움이 됩니다.

---

## 적용 팁(실무적으로 도움이 됐던 것)

- **업샘플 직후 + concat 직후**에 DSConv를 배치하면 깔끔합니다.
- 너무 과하게 줄이면(채널 폭을 급격히 줄이거나, 모든 블록을 DSConv로 바꾸기) 경계 성능이 먼저 흔들릴 수 있어,  
  **“decoder의 일부 단계만”** 적용하는 것도 실험할 가치가 있습니다.

---

## 다음에 볼 것

다음 글에서는 decoder보다 더 큰 그림인 **early downsampling(특히 maxpool 유지/제거)** 에서 자주 생기는 오해를 정리합니다.

