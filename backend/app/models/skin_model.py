"""
EfficientNet-B0 student model — mirrors the architecture from Phase 4.
"""

import timm
import torch.nn as nn


def create_student_model(num_classes: int = 7) -> nn.Module:
    """
    Instantiate the same EfficientNet-B0 architecture used during
    knowledge-distillation training (Phase 4).

    Parameters
    ----------
    num_classes : int
        Number of output classes (7 for the HAM10000 / ISIC taxonomy).

    Returns
    -------
    nn.Module
        Un-loaded EfficientNet-B0 ready to receive ``state_dict``.
    """
    model = timm.create_model(
        "efficientnet_b0",
        pretrained=False,
        num_classes=num_classes,
    )
    return model
