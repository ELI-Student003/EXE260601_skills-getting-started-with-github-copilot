from urllib.parse import quote

from fastapi.testclient import TestClient

from src.app import app

client = TestClient(app)


def test_get_activities():
    # Arrange

    # Act
    response = client.get("/activities")

    # Assert
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, dict)
    assert "Chess Club" in data
    assert "participants" in data["Chess Club"]
    assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_remove_participant():
    # Arrange
    activity_name = "Chess Club"
    email = "tester@example.com"
    encoded_activity = quote(activity_name, safe="")
    encoded_email = quote(email, safe="")

    # Act - signup
    signup_response = client.post(f"/activities/{encoded_activity}/signup?email={encoded_email}")

    # Assert - signup
    assert signup_response.status_code == 200
    assert signup_response.json()["message"] == f"Signed up {email} for {activity_name}"

    # Act - remove
    remove_response = client.delete(f"/activities/{encoded_activity}/participants?email={encoded_email}")

    # Assert - remove
    assert remove_response.status_code == 200
    assert remove_response.json()["message"] == f"Removed {email} from {activity_name}"


def test_duplicate_signup_returns_400():
    # Arrange
    activity_name = "Chess Club"
    email = "duplicate@example.com"
    encoded_activity = quote(activity_name, safe="")
    encoded_email = quote(email, safe="")

    # Act - first signup
    first_response = client.post(f"/activities/{encoded_activity}/signup?email={encoded_email}")

    # Assert - first signup succeeded
    assert first_response.status_code == 200

    # Act - duplicate signup
    duplicate_response = client.post(f"/activities/{encoded_activity}/signup?email={encoded_email}")

    # Assert - duplicate signup rejected
    assert duplicate_response.status_code == 400
    assert duplicate_response.json()["detail"] == "Student is already signed up for this activity"

    # Cleanup
    cleanup_response = client.delete(f"/activities/{encoded_activity}/participants?email={encoded_email}")
    assert cleanup_response.status_code == 200
