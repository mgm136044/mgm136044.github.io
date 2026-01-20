---
title: "오해 정리: MaxPool을 없애면 FLOPs가 줄어들까?"
date: 2026-01-20
tags: [CNN, FLOPs, MaxPool, Optimization]
---

# 오해 정리: MaxPool을 없애면 FLOPs가 줄어들까?

가끔 “MaxPool을 빼면 연산이 줄어들지 않나?”라는 질문을 보는데, **항상 그렇지 않습니다**(오히려 반대일 때가 많습니다).

이 글은 `Agent.md`에 적어둔 핵심 문장을 조금 더 풀어서 설명하는 글입니다:

- “maxpool 자체는 파라미터가 0이고 FLOPs도 작다.”
- “오히려 maxpool을 제거하면 중간 feature map이 커져 전체 FLOPs가 늘 수 있다.”

---

## 핵심 결론(짧게)

- **MaxPool 자체는 파라미터가 0이고 FLOPs도 작습니다.**
- 하지만 MaxPool을 제거하면 **feature map이 더 큰 상태로 뒤 레이어로 넘어가서**,  
  뒤쪽 conv 연산량이 커져 **전체 FLOPs가 증가**할 수 있습니다.

---

## 왜 그런가?

컨볼루션의 연산량은 대략 아래와 같이 **공간 크기(H×W)에 비례**합니다.

\[
\text{FLOPs} \propto H \times W \times C_{in} \times C_{out} \times k^2
\]

즉, 초반에 \(224 \rightarrow 56\)처럼 해상도를 줄이면, 그 뒤에 이어지는 레이어 전체가 “작은 지도” 위에서 계산하게 됩니다.

그래서 ResNet 계열에서 자주 보이는:

- `conv1(stride=2)` + `maxpool(stride=2)`  

같은 **early downsampling**이, 전체 FLOPs를 강하게 줄여주는 이유가 됩니다.

`Agent.md`에서도 이걸 “FLOPs 절감을 위해 `conv1(stride=2) + maxpool(stride=2)`를 유지”라고 정리해뒀습니다.

---

## 세그멘테이션에서는 더 조심해야 하는 포인트

세그멘테이션은 공간 정보(특히 경계)가 중요해서:

- 초반 다운샘플링이 지나치면 경계/소객체가 손상될 수 있고
- 반대로 다운샘플링을 너무 줄이면 계산량이 크게 늘 수 있습니다.

그래서 저는 보통:

- encoder는 검증된 downsampling을 유지하고
- decoder/skip/학습 세팅 쪽에서 성능을 끌어올리는 실험

부터 시작하는 편입니다.

---

## “그럼 무조건 maxpool을 유지해야 하나?”

아니요. 목표가 무엇이냐에 따라 달라집니다.

- **목표가 FLOPs 절감**이면: early downsampling(=stride2 + maxpool)을 유지하는 쪽이 유리한 경우가 많습니다.
- **목표가 경계/소객체 성능**이면: downsampling을 완화하거나(예: stride 조정), skip/decoder/학습 쪽에서 보완하는 설계가 필요합니다.

이 균형을 잡기 위해, 저는 구조를 완전히 갈아엎기보다 먼저:

- pooling/skip/decoder 채널 같은 “수정 비용이 낮은 축”을 실험하고
- 그 다음에 encoder stem을 만지는 순서

로 가는 편입니다.

