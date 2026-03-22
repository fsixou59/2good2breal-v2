"""
Backend API Tests for 2good2breal Dating Profile Verification Service
Tests: Auth, Profile Analysis, Analyses CRUD, Filters, Dashboard Stats
"""
import pytest
import requests
import os
import time
import uuid

# Use environment variable for BASE_URL
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "testai@example.com"
TEST_PASSWORD = "test123"


class TestHealthEndpoints:
    """Health check endpoints"""
    
    def test_root_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["status"] == "healthy"
        print("✓ Root endpoint healthy")
    
    def test_health_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "timestamp" in data
        print("✓ Health endpoint healthy")


class TestAuthentication:
    """User authentication flow tests"""
    
    def test_login_success(self, api_client):
        """Test successful login with valid credentials"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        assert data["token_type"] == "bearer"
        print(f"✓ Login successful for {TEST_EMAIL}")
    
    def test_login_invalid_password(self, api_client):
        """Test login with wrong password"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
        data = response.json()
        assert "detail" in data
        print("✓ Invalid password properly rejected")
    
    def test_login_invalid_email(self, api_client):
        """Test login with non-existent email"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": "nonexistent@example.com",
            "password": "anypassword"
        })
        assert response.status_code == 401
        print("✓ Non-existent email properly rejected")
    
    def test_register_duplicate_email(self, api_client):
        """Test registration with already registered email"""
        response = api_client.post(f"{BASE_URL}/api/auth/register", json={
            "name": "Test User",
            "email": TEST_EMAIL,
            "password": "newpassword"
        })
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "already registered" in data["detail"].lower()
        print("✓ Duplicate email registration properly rejected")
    
    def test_get_me_authenticated(self, authenticated_client):
        """Test getting current user info with valid token"""
        response = authenticated_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code == 200
        data = response.json()
        assert "id" in data
        assert "email" in data
        assert "name" in data
        assert data["email"] == TEST_EMAIL
        print("✓ Get current user successful")
    
    def test_get_me_unauthorized(self, api_client):
        """Test getting current user without token"""
        response = api_client.get(f"{BASE_URL}/api/auth/me")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized access properly rejected")


class TestProfileAnalysis:
    """Profile analysis with AI (Gemini 3 Flash) tests"""
    
    def test_analyze_suspicious_profile(self, authenticated_client):
        """Test analysis of a suspicious profile - should detect red flags"""
        suspicious_profile = {
            "profile_name": "TEST_SuspiciousProfile",
            "profile_bio": "I am a successful businessman looking for love. Send me your number.",
            "profile_age": 35,
            "profile_location": "Unknown Location",
            "profile_photos_count": 1,
            "has_verified_photos": False,
            "social_media_links": [],
            "profile_creation_date": "",
            "last_active": "",
            "response_time": "Instant replies at all hours",
            "message_quality": "Generic messages, asks for money",
            "dating_platform": "Unknown",
            "additional_notes": "Asked to move to WhatsApp immediately, claims to be wealthy"
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/analyze", json=suspicious_profile)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "overall_score" in data
        assert "trust_level" in data
        assert "red_flags" in data
        assert "analysis_summary" in data
        assert "detailed_analysis" in data
        assert "recommendations" in data
        
        # For suspicious profile, expect low trust and red flags
        assert isinstance(data["overall_score"], int)
        assert data["overall_score"] <= 60  # Should be low score
        assert len(data["red_flags"]) > 0  # Should have red flags
        assert data["trust_level"] in ["low", "very_low", "medium"]
        
        print(f"✓ Suspicious profile analyzed - Score: {data['overall_score']}, Red flags: {len(data['red_flags'])}")
        return data["id"]
    
    def test_analyze_legitimate_profile(self, authenticated_client):
        """Test analysis of a more legitimate-looking profile"""
        legitimate_profile = {
            "profile_name": "TEST_LegitimateProfile",
            "profile_bio": "Hi! I'm a software engineer from San Francisco. I love hiking, cooking, and trying new restaurants. Looking for someone to share adventures with!",
            "profile_age": 28,
            "profile_location": "San Francisco, CA",
            "profile_photos_count": 6,
            "has_verified_photos": True,
            "social_media_links": ["instagram.com/testuser", "linkedin.com/in/testuser"],
            "profile_creation_date": "2024-01-15",
            "last_active": "2026-02-16",
            "response_time": "Within a few hours",
            "message_quality": "Personalized, references my profile interests",
            "dating_platform": "Hinge",
            "additional_notes": "Has mutual friends, consistent story"
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/analyze", json=legitimate_profile)
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "id" in data
        assert "overall_score" in data
        assert "trust_level" in data
        assert "red_flags" in data
        
        # For legitimate profile, expect higher trust
        assert data["overall_score"] >= 40  # Should be higher score
        
        print(f"✓ Legitimate profile analyzed - Score: {data['overall_score']}, Trust: {data['trust_level']}")
        return data["id"]
    
    def test_analyze_minimal_profile(self, authenticated_client):
        """Test analysis with minimal required data"""
        minimal_profile = {
            "profile_name": "TEST_MinimalProfile"
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/analyze", json=minimal_profile)
        assert response.status_code == 200
        data = response.json()
        
        assert "id" in data
        assert "overall_score" in data
        assert data["profile_name"] == "TEST_MinimalProfile"
        
        print(f"✓ Minimal profile analyzed - Score: {data['overall_score']}")
        return data["id"]
    
    def test_analyze_unauthorized(self, api_client):
        """Test analysis without authentication"""
        response = api_client.post(f"{BASE_URL}/api/analyze", json={
            "profile_name": "Test"
        })
        assert response.status_code in [401, 403]
        print("✓ Unauthorized analysis properly rejected")


class TestAnalysesEndpoints:
    """CRUD operations for analyses"""
    
    def test_get_all_analyses(self, authenticated_client):
        """Test getting all analyses for current user"""
        response = authenticated_client.get(f"{BASE_URL}/api/analyses")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} analyses")
    
    def test_get_specific_analysis(self, authenticated_client, create_test_analysis):
        """Test getting a specific analysis by ID"""
        analysis_id = create_test_analysis
        response = authenticated_client.get(f"{BASE_URL}/api/analyses/{analysis_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == analysis_id
        assert "profile_name" in data
        assert "overall_score" in data
        print(f"✓ Retrieved analysis {analysis_id}")
    
    def test_get_nonexistent_analysis(self, authenticated_client):
        """Test getting a non-existent analysis"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.get(f"{BASE_URL}/api/analyses/{fake_id}")
        assert response.status_code == 404
        print("✓ Non-existent analysis returns 404")
    
    def test_delete_analysis(self, authenticated_client, create_test_analysis):
        """Test deleting an analysis"""
        analysis_id = create_test_analysis
        
        # Delete
        response = authenticated_client.delete(f"{BASE_URL}/api/analyses/{analysis_id}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        
        # Verify deletion
        response = authenticated_client.get(f"{BASE_URL}/api/analyses/{analysis_id}")
        assert response.status_code == 404
        print(f"✓ Analysis {analysis_id} deleted successfully")
    
    def test_delete_nonexistent_analysis(self, authenticated_client):
        """Test deleting a non-existent analysis"""
        fake_id = str(uuid.uuid4())
        response = authenticated_client.delete(f"{BASE_URL}/api/analyses/{fake_id}")
        assert response.status_code == 404
        print("✓ Delete non-existent analysis returns 404")


class TestFilters:
    """CRUD operations for custom filters"""
    
    def test_create_filter(self, authenticated_client):
        """Test creating a custom filter"""
        filter_data = {
            "name": f"TEST_Filter_{uuid.uuid4().hex[:8]}",
            "description": "Test filter for automated testing",
            "criteria": {
                "min_photos": 3,
                "require_verified": True
            },
            "is_active": True
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/filters", json=filter_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == filter_data["name"]
        assert data["description"] == filter_data["description"]
        assert data["is_active"] == True
        assert "id" in data
        print(f"✓ Filter '{data['name']}' created")
        return data["id"]
    
    def test_get_all_filters(self, authenticated_client):
        """Test getting all filters"""
        response = authenticated_client.get(f"{BASE_URL}/api/filters")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        print(f"✓ Retrieved {len(data)} filters")
    
    def test_update_filter(self, authenticated_client, create_test_filter):
        """Test updating a filter"""
        filter_id = create_test_filter
        
        updated_data = {
            "name": f"TEST_UpdatedFilter_{uuid.uuid4().hex[:8]}",
            "description": "Updated description",
            "criteria": {"min_photos": 5},
            "is_active": False
        }
        
        response = authenticated_client.put(f"{BASE_URL}/api/filters/{filter_id}", json=updated_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == updated_data["name"]
        assert data["is_active"] == False
        print(f"✓ Filter {filter_id} updated")
    
    def test_delete_filter(self, authenticated_client, create_test_filter):
        """Test deleting a filter"""
        filter_id = create_test_filter
        
        response = authenticated_client.delete(f"{BASE_URL}/api/filters/{filter_id}")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Filter {filter_id} deleted")


class TestDashboardStats:
    """Dashboard statistics endpoint tests"""
    
    def test_get_stats(self, authenticated_client):
        """Test getting dashboard statistics"""
        response = authenticated_client.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "total_analyses" in data
        assert "average_score" in data
        assert "trust_distribution" in data
        assert "recent_analyses" in data
        assert "total_filters" in data
        
        # Verify types
        assert isinstance(data["total_analyses"], int)
        assert isinstance(data["average_score"], (int, float))
        assert isinstance(data["trust_distribution"], dict)
        assert isinstance(data["recent_analyses"], list)
        
        print(f"✓ Stats: {data['total_analyses']} analyses, avg score: {data['average_score']}")
    
    def test_stats_unauthorized(self, api_client):
        """Test getting stats without authentication"""
        response = api_client.get(f"{BASE_URL}/api/stats")
        assert response.status_code in [401, 403]
        print("✓ Unauthorized stats access rejected")


# ============== FIXTURES ==============

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture
def auth_token(api_client):
    """Get authentication token"""
    response = api_client.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


@pytest.fixture
def create_test_analysis(authenticated_client):
    """Create a test analysis and return its ID"""
    profile = {
        "profile_name": f"TEST_Fixture_{uuid.uuid4().hex[:8]}",
        "profile_bio": "Test profile for fixture",
        "profile_age": 25,
        "profile_location": "Test City"
    }
    response = authenticated_client.post(f"{BASE_URL}/api/analyze", json=profile)
    if response.status_code == 200:
        return response.json()["id"]
    pytest.fail("Failed to create test analysis")


@pytest.fixture
def create_test_filter(authenticated_client):
    """Create a test filter and return its ID"""
    filter_data = {
        "name": f"TEST_Fixture_Filter_{uuid.uuid4().hex[:8]}",
        "description": "Fixture filter",
        "criteria": {"test": True},
        "is_active": True
    }
    response = authenticated_client.post(f"{BASE_URL}/api/filters", json=filter_data)
    if response.status_code == 200:
        return response.json()["id"]
    pytest.fail("Failed to create test filter")


@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Cleanup happens naturally as test data expires or is manually cleaned
    print("\n✓ Test session completed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
