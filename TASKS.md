# Proposed Maintenance Tasks

| Category | Description | Location |
| --- | --- | --- |
| Typo fix | The dashboard shows "Confidence: %NN" because the percent sign is prefixed incorrectly in the JSX template literal; adjust it so the number precedes the percent sign. | `frontend/src/App.js` line 116 |
| Bug fix | `generate_sensor_data_async` references `signal_strength` and `device_status` without defining them, causing runtime `NameError` exceptions for both the REST and WebSocket endpoints; initialize these fields before the `base_data` dictionary is built. | `backend/main.py` lines 101-104 |
| Docs/comment fix | The root README still advertises "Linear Regression" even though the implementation now uses `RandomForestRegressor`; update the documentation to match the current model architecture. | `README.md` lines 11-12 |
| Test improvement | Add FastAPI tests that exercise `get_weather_values` with a patched `_fetch_open_meteo_current` to verify the caching TTL path and the exception fallback so regressions in the weather caching logic are detected. | `backend/main.py` (functions `get_weather_values`, `_fetch_open_meteo_current`) |
