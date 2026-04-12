"""
RL Threshold Policy Network — exact replica of Phase 6.

The network takes a 4-dim state vector (malignancy probability, entropy,
max probability, prediction margin) and outputs a distribution over 20
discrete threshold values in [0.1, 0.9].
"""

import torch
import torch.nn as nn


class ThresholdPolicyNetwork(nn.Module):
    """Lightweight policy network for adaptive malignancy thresholds."""

    def __init__(
        self, state_dim: int = 4, n_actions: int = 20, hidden: int = 64
    ) -> None:
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden),
            nn.ReLU(),
            nn.ReLU(),                        # matches Phase 6 (double ReLU)
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.ReLU(),                        # matches Phase 6 (double ReLU)
            nn.Linear(hidden, n_actions),
            nn.Softmax(dim=-1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)
