"""
Image preprocessing transforms – matches the validation transforms
used during training (Phase 4 / Phase 5).
"""

from torchvision import transforms

from app.config import IMAGE_SIZE, IMAGENET_MEAN, IMAGENET_STD


def build_inference_transforms(image_size: int = IMAGE_SIZE) -> transforms.Compose:
    """Return the same deterministic transform pipeline used at eval time."""
    return transforms.Compose(
        [
            transforms.Resize((image_size, image_size)),
            transforms.ToTensor(),
            transforms.Normalize(mean=IMAGENET_MEAN, std=IMAGENET_STD),
        ]
    )
