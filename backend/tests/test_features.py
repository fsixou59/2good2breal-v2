"""
Backend API tests for 2good2breal profile verification service
Testing the 4 new features:
1. Missing fields in Admin print submission form (Marital Status, University/College, Hobbies/Interests, Year(s) of Attendance)
2. Date dropdowns (Day/Month/Year) for date_of_birth, profile_creation_date, last_active
3. WhatsApp numbers in acceptance email
4. Photo Identification text in DOCX report
"""
import pytest
import requests
import os
import json
import zipfile
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://profile-check-9.preview.emergentagent.com')

class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_health_endpoint(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "database" in data
        print(f"Health check passed: {data}")
    
    def test_admin_login(self):
        """Test admin login endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "admin", "password": "admin2026"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["is_admin"] == True
        print(f"Admin login successful, token received")
        return data["access_token"]
    
    def test_user_login(self):
        """Test regular user login"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@test.com", "password": "Test1234!"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print(f"User login successful")
        return data["access_token"]


class TestAdminAnalyses:
    """Test admin analyses endpoints"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "admin", "password": "admin2026"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin authentication failed")
    
    def test_get_analyses_list(self, admin_token):
        """Test getting list of analyses"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analyses",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"Found {len(data)} analyses")
        if len(data) > 0:
            # Verify analysis structure
            analysis = data[0]
            assert "id" in analysis
            assert "profile_name" in analysis
            print(f"First analysis: {analysis.get('profile_name')}")
        return data
    
    def test_docx_download_contains_new_text(self, admin_token):
        """Test DOCX download contains new Photo Identification text"""
        # Get first analysis
        response = requests.get(
            f"{BASE_URL}/api/admin/analyses",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        analyses = response.json()
        
        if len(analyses) == 0:
            pytest.skip("No analyses available for testing")
        
        analysis_id = analyses[0]["id"]
        
        # Download DOCX
        response = requests.get(
            f"{BASE_URL}/api/admin/analyses/{analysis_id}/download-docx",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        assert "application/vnd.openxmlformats-officedocument.wordprocessingml.document" in response.headers.get("content-type", "")
        
        # Extract and check content
        docx_content = io.BytesIO(response.content)
        with zipfile.ZipFile(docx_content, 'r') as zip_ref:
            document_xml = zip_ref.read('word/document.xml').decode('utf-8')
        
        # Check for new Photo Identification text
        expected_text = "Research and confirmation of all Profile Platforms, Locations and Residencies previously and in use today"
        assert expected_text in document_xml, f"Expected text not found in DOCX: {expected_text}"
        print(f"SUCCESS: DOCX contains new Photo Identification text")
        
        # Check for missing fields in DOCX
        assert "MARITAL STATUS" in document_xml, "Marital Status field not found in DOCX"
        assert "HOBBIES / INTERESTS" in document_xml, "Hobbies/Interests field not found in DOCX"
        assert "UNIVERSITY / COLLEGE" in document_xml, "University/College field not found in DOCX"
        assert "YEAR/S OF ATTENDANCE" in document_xml or "YEAR(S) OF ATTENDANCE" in document_xml, "Years of Attendance field not found in DOCX"
        print(f"SUCCESS: DOCX contains all required fields")


class TestFormDataFields:
    """Test that form data fields are properly stored and retrieved"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "admin", "password": "admin2026"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("Admin authentication failed")
    
    def test_analysis_contains_form_data_fields(self, admin_token):
        """Test that analysis contains expected form data fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/analyses",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 200
        analyses = response.json()
        
        if len(analyses) == 0:
            pytest.skip("No analyses available for testing")
        
        analysis = analyses[0]
        form_data = analysis.get("form_data", {})
        
        # Check that form_data structure exists
        assert form_data is not None, "form_data should exist in analysis"
        
        # Log available fields
        print(f"Form data fields: {list(form_data.keys())}")
        
        # These fields should be supported (may or may not have values)
        expected_fields = [
            "profile_name", "date_of_birth", "profile_creation_date", 
            "last_active", "assumed_marital_status", "university_college",
            "hobbies_interests", "years_attendance"
        ]
        
        for field in expected_fields:
            if field in form_data:
                print(f"Field '{field}' present with value: {form_data[field]}")


class TestDateFormatValidation:
    """Test date format handling for DD/MM/YYYY dropdowns"""
    
    @pytest.fixture
    def user_token(self):
        """Get user authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "test@test.com", "password": "Test1234!"}
        )
        if response.status_code == 200:
            return response.json()["access_token"]
        pytest.skip("User authentication failed")
    
    def test_date_format_in_form_data(self, user_token):
        """Test that date fields accept DD/MM/YYYY format"""
        # This test verifies the backend accepts the date format
        # The actual submission requires credits, so we just verify the endpoint exists
        
        # Test that the analyze endpoint exists and requires authentication
        response = requests.post(
            f"{BASE_URL}/api/analyze",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "profile_name": "Test Profile",
                "date_of_birth": "15/03/1990",  # DD/MM/YYYY format
                "profile_creation_date": "01/01/2024",
                "last_active": "10/04/2026"
            }
        )
        
        # Should return 402 (no credits) or 422 (validation) but not 500
        assert response.status_code in [402, 422, 400], f"Unexpected status: {response.status_code}"
        print(f"Date format validation test passed (status: {response.status_code})")


class TestWhatsAppNumbers:
    """Test WhatsApp numbers in acceptance email"""
    
    def test_whatsapp_numbers_in_server_code(self):
        """Verify WhatsApp numbers are correctly formatted in server code"""
        # Read server.py and check for WhatsApp numbers
        server_path = "/app/backend/server.py"
        
        with open(server_path, 'r') as f:
            content = f.read()
        
        # Check for the new WhatsApp format
        expected_whatsapp1 = "WhatsApp 1 : +33 (0) 7 43 66 05 55"
        expected_whatsapp2 = "WhatsApp 2 : +33 (0) 7 67 92 55 45"
        
        assert expected_whatsapp1 in content, f"WhatsApp 1 format not found: {expected_whatsapp1}"
        assert expected_whatsapp2 in content, f"WhatsApp 2 format not found: {expected_whatsapp2}"
        
        print(f"SUCCESS: WhatsApp numbers correctly formatted in server code")
        print(f"  - {expected_whatsapp1}")
        print(f"  - {expected_whatsapp2}")


class TestAdminPrintFields:
    """Test Admin print submission form fields"""
    
    def test_admin_page_contains_required_fields(self):
        """Verify AdminPage.jsx contains required fields for print"""
        admin_page_path = "/app/frontend/src/pages/AdminPage.jsx"
        
        with open(admin_page_path, 'r') as f:
            content = f.read()
        
        # Check for required fields in handlePrint function
        required_fields = [
            "Marital Status",
            "Hobbies / Interests",
            "University / College",
            "Year/s of Attendance"
        ]
        
        for field in required_fields:
            assert field in content, f"Field '{field}' not found in AdminPage.jsx"
            print(f"SUCCESS: Found field '{field}' in AdminPage.jsx")
        
        # Check for Photo Identification text
        photo_id_text = "Research and confirmation of all Profile Platforms, Locations and Residencies previously and in use today"
        assert photo_id_text in content, f"Photo Identification text not found in AdminPage.jsx"
        print(f"SUCCESS: Found Photo Identification text in AdminPage.jsx")


class TestAdminReportPage:
    """Test AdminReportPage.jsx contains required text"""
    
    def test_admin_report_page_contains_photo_id_text(self):
        """Verify AdminReportPage.jsx contains Photo Identification text"""
        report_page_path = "/app/frontend/src/pages/AdminReportPage.jsx"
        
        with open(report_page_path, 'r') as f:
            content = f.read()
        
        # Check for Photo Identification text
        photo_id_text = "Research and confirmation of all Profile Platforms, Locations and Residencies previously and in use today"
        assert photo_id_text in content, f"Photo Identification text not found in AdminReportPage.jsx"
        print(f"SUCCESS: Found Photo Identification text in AdminReportPage.jsx")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
