import sys
import time
import zlib
import struct
import httpx
from typing import Dict, Any

BASE_URL = "http://127.0.0.1:8000/api/v1"

def create_valid_test_png() -> bytes:
    width, height = 64, 64
    raw_bytes = bytearray()
    for y in range(height):
        raw_bytes.append(0)
        for x in range(width):
            raw_bytes.extend([190, 110, 60])
    
    compressed = zlib.compress(bytes(raw_bytes))
    png = bytearray(b"\x89PNG\r\n\x1a\n")
    
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 2, 0, 0, 0)
    ihdr_crc = zlib.crc32(b"IHDR" + ihdr_data)
    png.extend(struct.pack(">I", len(ihdr_data)))
    png.extend(b"IHDR")
    png.extend(ihdr_data)
    png.extend(struct.pack(">I", ihdr_crc))
    
    idat_crc = zlib.crc32(b"IDAT" + compressed)
    png.extend(struct.pack(">I", len(compressed)))
    png.extend(b"IDAT")
    png.extend(compressed)
    png.extend(struct.pack(">I", idat_crc))
    
    iend_crc = zlib.crc32(b"IEND")
    png.extend(struct.pack(">I", 0))
    png.extend(b"IEND")
    png.extend(struct.pack(">I", iend_crc))
    
    return bytes(png)

class SystemVerifier:
    def __init__(self):
        self.client = httpx.Client(timeout=45.0)
        self.tokens: Dict[str, str] = {}
        self.passed_tests = 0
        self.failed_tests = 0

    def log(self, step: str, details: str, status: str = "INFO"):
        symbol = "[+]" if status == "PASS" else "[-]" if status == "FAIL" else "[*]"
        print(f"{symbol} {step.ljust(42)}: {details}")

    def record(self, step: str, condition: bool, details: str):
        if condition:
            self.passed_tests += 1
            self.log(step, details, "PASS")
        else:
            self.failed_tests += 1
            self.log(step, details, "FAIL")

    def run_all_tests(self):
        print("================================================================================")
        print("                   SONURA AUTOMATED END-TO-END SYSTEM TEST                      ")
        print("================================================================================")

        self.test_health_endpoint()
        self.test_authentication_all_roles()
        self.test_super_admin_operations()
        self.test_tenant_provisioning_and_isolation()
        self.test_facilities_and_templates()
        self.test_rag_vector_search()
        self.test_inspection_lifecycle()
        self.test_vision_defect_endpoint()
        self.test_notifications_pipeline()
        self.test_team_safety_checks()
        self.test_contact_inquiries()

        print("================================================================================")
        total = self.passed_tests + self.failed_tests
        rate = round((self.passed_tests / total) * 100, 1) if total > 0 else 0
        print(f"TEST SUMMARY: {self.passed_tests}/{total} Passed ({rate}% Success Rate)")
        print("================================================================================")

        if self.failed_tests > 0:
            sys.exit(1)

    def test_health_endpoint(self):
        try:
            res = self.client.get("http://127.0.0.1:8000/health")
            self.record("Health Check", res.status_code == 200, f"Status {res.status_code}")
        except Exception as e:
            self.record("Health Check", False, f"Connection failure: {str(e)}")

    def test_authentication_all_roles(self):
        accounts = [
            ("super_admin", "admin@sonura.ai", "sonura2026"),
            ("org_admin", "john@titanhvac.com", "sonura2026"),
            ("supervisor", "sarah@titanhvac.com", "sonura2026"),
            ("inspector", "op1@titanhvac.com", "sonura2026"),
        ]

        for role_key, email, password in accounts:
            try:
                res = self.client.post(
                    f"{BASE_URL}/auth/login",
                    json={"email": email, "password": password}
                )
                success = res.status_code == 200 and "access_token" in res.json()
                if success:
                    token = res.json()["access_token"]
                    self.tokens[role_key] = token
                    self.record(f"Auth Role: {role_key}", True, f"Token generated for {email}")
                else:
                    self.record(f"Auth Role: {role_key}", False, f"Status {res.status_code}: {res.text}")
            except Exception as e:
                self.record(f"Auth Role: {role_key}", False, f"Error: {str(e)}")

    def test_super_admin_operations(self):
        token = self.tokens.get("super_admin")
        if not token:
            self.record("Super Admin Telemetry", False, "Missing super admin token")
            return

        headers = {"Authorization": f"Bearer {token}"}
        try:
            stats_res = self.client.get(f"{BASE_URL}/organizations/stats", headers=headers)
            self.record("Super Admin Stats Telemetry", stats_res.status_code == 200, f"HTTP {stats_res.status_code}")

            analytics_res = self.client.get(f"{BASE_URL}/organizations/analytics/global", headers=headers)
            self.record("Super Admin Global Analytics", analytics_res.status_code == 200, f"HTTP {analytics_res.status_code}")

            orgs_res = self.client.get(f"{BASE_URL}/organizations/", headers=headers)
            self.record("Super Admin List Organizations", orgs_res.status_code == 200, f"Loaded {len(orgs_res.json())} tenants")
        except Exception as e:
            self.record("Super Admin Operations", False, f"Exception: {str(e)}")

    def test_tenant_provisioning_and_isolation(self):
        token = self.tokens.get("super_admin")
        if not token:
            return

        headers = {"Authorization": f"Bearer {token}"}
        unique_stamp = int(time.time())
        test_email = f"lead.admin{unique_stamp}@quantumgrid.com"

        provision_payload = {
            "name": f"Quantum Power Grid {unique_stamp}",
            "plan": "enterprise",
            "admin_name": "Marcus Kane",
            "admin_email": test_email,
            "max_users": 50,
            "max_sites": 20,
            "max_audits": 1000,
            "storage_limit_mb": 5120
        }

        try:
            res = self.client.post(f"{BASE_URL}/organizations/provision", headers=headers, json=provision_payload)
            success = res.status_code == 201 and "org_id" in res.json()
            self.record("Tenant Provisioning", success, f"New Org Created: {res.json().get('org_name')}")

            if success:
                new_org_id = res.json()["org_id"]
                details_res = self.client.get(f"{BASE_URL}/organizations/{new_org_id}/details", headers=headers)
                self.record("Tenant Drilldown Details", details_res.status_code == 200, "Retrieved organization details")

                quota_payload = {"max_users": 60, "max_sites": 25}
                quota_res = self.client.patch(f"{BASE_URL}/organizations/{new_org_id}/quotas", headers=headers, json=quota_payload)
                self.record("Tenant Quota Updating", quota_res.status_code == 200, "Updated quotas")

                suspend_res = self.client.post(f"{BASE_URL}/organizations/{new_org_id}/suspend", headers=headers, json={"reason": "Test"})
                self.record("Tenant Suspension", suspend_res.status_code == 200, "Suspended tenant")

                resume_res = self.client.post(f"{BASE_URL}/organizations/{new_org_id}/resume", headers=headers)
                self.record("Tenant Resumption", resume_res.status_code == 200, "Resumed tenant access")

                cleanup_res = self.client.delete(f"{BASE_URL}/organizations/{new_org_id}", headers=headers)
                self.record("Tenant Deprovisioning", cleanup_res.status_code == 200, "Cleaned up test tenant")
        except Exception as e:
            self.record("Tenant Provisioning Workflow", False, f"Exception: {str(e)}")

    def test_facilities_and_templates(self):
        token = self.tokens.get("org_admin")
        if not token:
            return

        headers = {"Authorization": f"Bearer {token}"}
        unique_stamp = int(time.time())

        try:
            template_payload = {
                "title": f"Substation Protocol {unique_stamp}",
                "category": "Electrical",
                "items": [
                    {"item_id": "1", "question": "Transformer oil temperature under 65C?", "status": "pending", "flagged": False},
                    {"item_id": "2", "question": "Busbar insulators free of flashover tracking?", "status": "pending", "flagged": False}
                ]
            }
            tmpl_res = self.client.post(f"{BASE_URL}/templates/", headers=headers, json=template_payload)
            tmpl_ok = tmpl_res.status_code == 201
            self.record("Template Creation", tmpl_ok, f"Template ID: {tmpl_res.json().get('id') if tmpl_ok else 'Failed'}")

            site_payload = {
                "unit_id": f"TEST-UNIT-{unique_stamp}",
                "title": "Main Grid Relay Station",
                "assigned_inspector": "Operator 01",
                "bound_template_id": tmpl_res.json().get("id") if tmpl_ok else None
            }
            site_res = self.client.post(f"{BASE_URL}/sites/", headers=headers, json=site_payload)
            site_ok = site_res.status_code == 201
            self.record("Facility Registration", site_ok, f"Unit: {site_payload['unit_id']}")

            sites_list = self.client.get(f"{BASE_URL}/sites/", headers=headers)
            self.record("List Facility Sites", sites_list.status_code == 200, f"Count: {len(sites_list.json())}")

            if site_ok:
                site_id = site_res.json()["id"]
                del_site = self.client.delete(f"{BASE_URL}/sites/{site_id}", headers=headers)
                self.record("Facility Deletion", del_site.status_code == 200, "Deleted test site")

            if tmpl_ok:
                tmpl_id = tmpl_res.json()["id"]
                del_tmpl = self.client.delete(f"{BASE_URL}/templates/{tmpl_id}", headers=headers)
                self.record("Template Deletion", del_tmpl.status_code == 200, "Deleted test template")
        except Exception as e:
            self.record("Facility and Template Tests", False, f"Exception: {str(e)}")

    def test_rag_vector_search(self):
        token = self.tokens.get("inspector")
        if not token:
            return

        headers = {"Authorization": f"Bearer {token}"}
        try:
            rag_res = self.client.post(
                f"{BASE_URL}/rag/query",
                headers=headers,
                json={"query": "What is the standard compressor suction pressure range?", "top_k": 2}
            )
            ok = rag_res.status_code == 200 and "answer" in rag_res.json()
            self.record("RAG Vector Query", ok, f"Similarity Confidence: {rag_res.json().get('confidence_score') if ok else '0'}")
        except Exception as e:
            self.record("RAG Vector Query", False, f"Exception: {str(e)}")

    def test_inspection_lifecycle(self):
        inspector_token = self.tokens.get("inspector")
        supervisor_token = self.tokens.get("supervisor")
        if not inspector_token or not supervisor_token:
            return

        i_headers = {"Authorization": f"Bearer {inspector_token}"}
        s_headers = {"Authorization": f"Bearer {supervisor_token}"}

        try:
            insp_res = self.client.get(f"{BASE_URL}/inspections/BUILDING-4B", headers=i_headers)
            ok = insp_res.status_code == 200
            self.record("Fetch Active Inspection", ok, f"Unit: BUILDING-4B Status: {insp_res.json().get('status') if ok else 'Failed'}")

            voice_token_res = self.client.post(
                f"{BASE_URL}/voice/token",
                headers=i_headers,
                json={"unit_id": "BUILDING-4B", "participant_id": "technician-test"}
            )
            v_ok = voice_token_res.status_code == 200 and "token" in voice_token_res.json()
            self.record("LiveKit WebRTC Token", v_ok, "Generated room token")

            report_res = self.client.get(f"{BASE_URL}/inspections/BUILDING-4B/report", headers=i_headers)
            r_ok = report_res.status_code == 200 and "certificate_id" in report_res.json()
            self.record("Single-Page Certificate Report", r_ok, f"Cert ID: {report_res.json().get('certificate_id') if r_ok else 'Failed'}")

            review_res = self.client.patch(
                f"{BASE_URL}/inspections/BUILDING-4B/status",
                headers=s_headers,
                json={"status": "in_progress", "notes": "Automated test verification cycle."}
            )
            self.record("Supervisor Status Sign-Off", review_res.status_code == 200, "Status updated")
        except Exception as e:
            self.record("Inspection Lifecycle", False, f"Exception: {str(e)}")

    def test_vision_defect_endpoint(self):
        token = self.tokens.get("inspector")
        if not token:
            return

        headers = {"Authorization": f"Bearer {token}"}
        valid_png = create_valid_test_png()

        try:
            files = {"file": ("test_defect_64x64.png", valid_png, "image/png")}
            data = {"unit_id": "BUILDING-4B"}

            res = self.client.post(
                f"{BASE_URL}/vision/analyze-photo",
                headers=headers,
                files=files,
                data=data
            )
            ok = res.status_code == 200 and "analysis" in res.json()
            summary = res.json().get("analysis", {}).get("defect_summary", "Analyzed") if ok else res.text
            self.record("Multimodal Vision Defect Triage", ok, f"Analysis: {summary[:55]}")
        except Exception as e:
            self.record("Multimodal Vision Triage", False, f"Exception: {str(e)}")

    def test_notifications_pipeline(self):
        token = self.tokens.get("inspector")
        if not token:
            return

        headers = {"Authorization": f"Bearer {token}"}
        try:
            res = self.client.get(f"{BASE_URL}/notifications/", headers=headers)
            ok = res.status_code == 200
            self.record("Query Notifications Inbox", ok, f"Fetched {len(res.json()) if ok else 0} alerts")
        except Exception as e:
            self.record("Notifications Pipeline", False, f"Exception: {str(e)}")

    def test_team_safety_checks(self):
        token = self.tokens.get("org_admin")
        if not token:
            return

        headers = {"Authorization": f"Bearer {token}"}
        try:
            members_res = self.client.get(f"{BASE_URL}/team/", headers=headers)
            if members_res.status_code == 200 and len(members_res.json()) > 0:
                first_member_id = members_res.json()[0]["id"]
                safety_res = self.client.get(f"{BASE_URL}/team/{first_member_id}/safety-check", headers=headers)
                ok = safety_res.status_code == 200 and "can_delete_or_suspend" in safety_res.json()
                self.record("Team Safety Check Verification", ok, "Verified safety check for member")
            else:
                self.record("Team Safety Check Verification", False, "No team members found to test")
        except Exception as e:
            self.record("Team Safety Check", False, f"Exception: {str(e)}")

    def test_contact_inquiries(self):
        try:
            payload = {
                "organization": "Titan Testing Corp",
                "name": "Audit Officer",
                "email": "auditor@titanhvac.com",
                "scale": "10-50",
                "message": "Automated suite validation verification."
            }
            res = self.client.post(f"{BASE_URL}/contact/inquiry", json=payload)
            self.record("Contact Sales Inquiry", res.status_code == 200, "Inquiry dispatched successfully")
        except Exception as e:
            self.record("Contact Inquiry Test", False, f"Exception: {str(e)}")

if __name__ == "__main__":
    verifier = SystemVerifier()
    verifier.run_all_tests()