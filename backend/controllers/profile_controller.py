from backend.services.profile_service import get_profile


def handle_profile_request():
    return get_profile()