from moggpt.scoring import FeatureScores, evaluate_framemogging


def test_framemogged_case():
    result = evaluate_framemogging(
        FeatureScores(
            jawline=3,
            facial_symmetry=4,
            posture=2,
            shoulder_width=4,
            confidence=3,
        )
    )
    assert result["got_framemogged"] is True
    assert result["label"] == "FRAMEMOGGED"


def test_mogging_case():
    result = evaluate_framemogging(
        FeatureScores(
            jawline=8,
            facial_symmetry=8,
            posture=7,
            shoulder_width=9,
            confidence=8,
        )
    )
    assert result["got_framemogged"] is False
    assert result["label"] == "MOGGING"
