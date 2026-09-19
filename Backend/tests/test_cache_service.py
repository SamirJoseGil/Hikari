from app.services.cache_service import MemoryQueryCache


def test_make_key_is_stable_for_same_normalized_text():
    key1 = MemoryQueryCache.make_key("me despidieron sin justa causa")
    key2 = MemoryQueryCache.make_key("me despidieron sin justa causa")
    assert key1 == key2


def test_make_key_differs_for_different_text():
    key1 = MemoryQueryCache.make_key("me despidieron sin justa causa")
    key2 = MemoryQueryCache.make_key("me deben pagar horas extra")
    assert key1 != key2


def test_get_returns_none_when_missing():
    cache = MemoryQueryCache()
    assert cache.get("unknown-key") is None


def test_set_then_get_roundtrip():
    cache = MemoryQueryCache()
    key = MemoryQueryCache.make_key("consulta de prueba")
    cache.set(key, {"scope": "laboral", "intent": "general_laboral"})
    assert cache.get(key) == {"scope": "laboral", "intent": "general_laboral"}
