"""Core scoring logic for MogGPT."""

from dataclasses import dataclass


@dataclass
class FeatureScores:
    jawline: int
    facial_symmetry: int
    posture: int
    shoulder_width: int
    confidence: int

    def validate(self) -> None:
        for field_name, value in self.__dict__.items():
            if not isinstance(value, int):
                raise ValueError(f"{field_name} must be an integer")
            if value < 0 or value > 10:
                raise ValueError(f"{field_name} must be between 0 and 10")


WEIGHTS = {
    "jawline": 1.2,
    "facial_symmetry": 1.1,
    "posture": 0.9,
    "shoulder_width": 1.0,
    "confidence": 0.8,
}


def evaluate_framemogging(scores: FeatureScores) -> dict:
    """Return whether person got framemogged plus confidence and reasons."""
    scores.validate()

    weighted_total = sum(
        getattr(scores, key) * weight for key, weight in WEIGHTS.items()
    )
    normalized = round((weighted_total / (10 * sum(WEIGHTS.values()))) * 100, 1)

    got_framemogged = normalized < 55

    strengths = []
    risks = []
    for key in WEIGHTS:
        value = getattr(scores, key)
        display = key.replace("_", " ").title()
        if value >= 7:
            strengths.append(display)
        elif value <= 4:
            risks.append(display)

    return {
        "score": normalized,
        "got_framemogged": got_framemogged,
        "label": "FRAMEMOGGED" if got_framemogged else "MOGGING",
        "strengths": strengths,
        "risk_factors": risks,
        "summary": (
            "Needs aura patch and posture buff."
            if got_framemogged
            else "Strong frame presence. Certified mogger."
        ),
    }
