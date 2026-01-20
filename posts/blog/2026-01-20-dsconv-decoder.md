---
title: Decoder를 가볍게: DSConv(Depthwise Separable Conv) 적용 노트
date: 2026-01-20
tags: [Segmentation, DSConv, Optimization]
---

# Decoder를 가볍게: DSConv(Depthwise Separable Conv) 적용 노트

세그멘테이션에서 decoder는 업샘플 후 feature를 여러 번 “정리(refine)”해야 해서, 생각보다 연산이 쉽게 커집니다. 그래서 decoder 쪽에 **DSConv(Depthwise Separable Convolution)** 를 넣어 계산량을 줄이는 전략을 자주 씁니다.

이 글은 `Agent.md`에 정리돼 있던 DSConv 정의를 출발점으로, **“왜 decoder에만 넣는지 / 어디에 넣는지 / 무엇을 기대하는지”** 를 조금 더 자세히 풀어쓴 버전입니다.

---

## DSConv는 무엇이 다른가?

일반적인 3×3 Conv는 **공간 필터링 + 채널 믹싱**을 한 번에 합니다.

DSConv는 이걸 둘로 분리합니다.

1. **Depthwise 3×3**: 채널별로 따로 3×3을 적용 (`groups=in_channels`)
2. **Pointwise 1×1**: 1×1 conv로 채널을 섞고(out_channels로) 변환

결과적으로 **비슷한 표현력을 유지하면서** 파라미터/연산을 줄이는 방향으로 설계할 수 있습니다.

---

## 직관적으로 “어디서 이득이 큰가?”

Conv 연산은 대략 아래 항에 비례해서 커집니다.

- 공간 크기 \(H \times W\)
- 채널 곱 \(C_{in} \times C_{out}\)
- 커널 크기 \(k^2\)

decoder는 보통 업샘플을 하면서 \(H, W\)가 커지고, 게다가 U-Net에서는 **skip concat으로 채널까지 커질 수 있어서**(concat 직후 \(C_{in}\)이 커짐) 3×3 Conv가 갑자기 무거워지기 쉽습니다.

따라서 “concat 직후의 refine conv” 자리에 DSConv를 놓는 것이 체감 이득이 큰 편입니다.

---

## “왜 encoder가 아니라 decoder에서 쓰나?”

제 기준으로는 아래 이유가 큽니다.

- **encoder는 표현력/일반화가 중요**: backbone은 검증된 구조(ResNet18)를 그대로 쓰는 편이 안전
- **decoder는 반복적인 3×3 refine가 많음**: 여기를 가볍게 만들면 전체 FLOPs에 체감이 큼
- **skip concat으로 채널이 늘어남**: concat 직후 3×3 conv가 무거워지기 쉬운데, DSConv가 특히 도움이 됩니다.

여기에 한 가지를 더하면:

- **encoder는 “다양한 데이터셋에서 강한 표현력”이 이미 검증된 구조를 쓰는 게 리스크가 낮고**, decoder는 과제/데이터셋/목표에 따라 훨씬 자주 바꾸는 영역이라 실험 속도가 빠릅니다.

---

## 적용 팁(실무적으로 도움이 됐던 것)

- **업샘플 직후 + concat 직후**에 DSConv를 배치하면 깔끔합니다.
- 너무 과하게 줄이면(채널 폭을 급격히 줄이거나, 모든 블록을 DSConv로 바꾸기) 경계 성능이 먼저 흔들릴 수 있어,  
  **“decoder의 일부 단계만”** 적용하는 것도 실험할 가치가 있습니다.

---

## `Agent.md` 기준: DSConv를 어떻게 정의했나?

`Agent.md`에서는 DSConv를 “컨볼루션 1개”가 아니라 아래 두 단계를 묶은 블록으로 정의했습니다.

1. **Depthwise 3×3**: `groups=in_ch`로 채널별 공간 필터링
2. **Pointwise 1×1**: 채널 mixing + `out_ch`로 변환

즉, “decoder를 구성하는 기본 빌딩 블록”을 3×3 Conv에서 DSConv로 바꿔서, 같은 레벨의 refine을 더 싸게 수행하는 전략입니다.

---

## 다음에 볼 것

다음 글에서는 decoder보다 더 큰 그림인 **early downsampling(특히 maxpool 유지/제거)** 에서 자주 생기는 오해를 정리합니다.

