import unittest
import tempfile
import os
from fastapi.testclient import TestClient
from main import app

class TestLawAgentBackend(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)

    def test_root(self):
        response = self.client.get("/")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "online")

    def test_health(self):
        response = self.client.get("/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "healthy")

    def test_omniroute_status(self):
        response = self.client.get("/api/v1/omniroute-status")
        self.assertEqual(response.status_code, 200)
        self.assertIn("omniroute_online", response.json())

    def test_business_examination(self):
        payload = {
            "user_id": "test_user",
            "business_type": "Retail"
        }
        response = self.client.post("/api/v1/business-examination", json=payload)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["user_id"], "test_user")
        self.assertIn("action_required", data)

    def test_workflows(self):
        # 1. Start Workflow
        start_payload = {
            "user_id": "test_user",
            "workflow_type": "gst_prep"
        }
        response = self.client.post("/api/v1/workflows/start", json=start_payload)
        self.assertEqual(response.status_code, 200)
        workflow_id = response.json()["workflow_id"]

        # 2. List Workflows
        response = self.client.get("/api/v1/workflows/list?user_id=test_user")
        self.assertEqual(response.status_code, 200)
        self.assertTrue(len(response.json()) > 0)

        # 3. Update Step
        update_payload = {
            "step_index": 0,
            "completed": True,
            "step_data": {"test_key": "test_value"}
        }
        response = self.client.post(f"/api/v1/workflows/{workflow_id}/update-step", json=update_payload)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["steps_completed"][0])

    def test_gst_prep_calculate(self):
        payload = {
            "sales_records": [
                {"amount": 1000, "tax_rate": 18, "hsn_code": "9983", "interstate": False}
            ],
            "entity_name": "Test Entity",
            "period": "Aug 2026"
        }
        response = self.client.post("/api/v1/workflows/gst-prep-calculate", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("tax_liability_estimate", response.json())

    def test_generate_notice_draft(self):
        payload = {
            "sender_name": "Sender Name",
            "recipient_name": "Recipient Name",
            "recipient_address": "Test Address",
            "dispute_reason": "Unpaid dues",
            "dispute_amount": 50000,
            "incident_date": "2026-08-01"
        }
        response = self.client.post("/api/v1/workflows/generate-notice-draft", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertIn("draft_notice", response.json())

    def test_voice_tool_callback(self):
        payload = {
            "user_id": "test_user",
            "tool_name": "check_document_vault_deadlines",
            "arguments": {}
        }
        response = self.client.post("/api/v1/voice/tool-callback", json=payload)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])

    def test_voice_fallback_pipeline(self):
        # Create a dummy small wav file
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
            tmp.write(b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00")
            audio_path = tmp.name

        try:
            with open(audio_path, "rb") as f:
                response = self.client.post(
                    "/api/v1/voice/fallback-pipeline",
                    data={
                        "user_id": "test_user",
                        "conversation_history": "[]"
                    },
                    files={"audio_file": ("dummy.wav", f, "audio/wav")}
                )
            self.assertEqual(response.status_code, 200)
            self.assertIn("audio_response", response.json())
        finally:
            if os.path.exists(audio_path):
                os.remove(audio_path)

if __name__ == "__main__":
    unittest.main()
