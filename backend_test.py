import requests
import sys
import json
from datetime import datetime

class ProfileVerifyAPITester:
    def __init__(self, base_url="https://dating-profile-check.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=30)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_health_check(self):
        """Test health endpoints"""
        print("\n=== HEALTH CHECK TESTS ===")
        
        # Test root endpoint
        self.run_test("Root Health Check", "GET", "", 200)
        
        # Test health endpoint
        self.run_test("Health Endpoint", "GET", "health", 200)

    def test_auth_flow(self):
        """Test authentication flow"""
        print("\n=== AUTHENTICATION TESTS ===")
        
        # Test user registration
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "name": f"Test User {timestamp}",
            "email": f"test{timestamp}@example.com",
            "password": "password123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_user
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            self.user_id = response['user']['id']
            print(f"   Token obtained: {self.token[:20]}...")
        else:
            print("❌ Registration failed - cannot continue with auth tests")
            return False

        # Test login with same credentials
        login_data = {
            "email": test_user["email"],
            "password": test_user["password"]
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']  # Update token
            print(f"   New token obtained: {self.token[:20]}...")

        # Test get current user
        self.run_test("Get Current User", "GET", "auth/me", 200)
        
        # Test invalid login
        invalid_login = {
            "email": "invalid@example.com",
            "password": "wrongpassword"
        }
        self.run_test("Invalid Login", "POST", "auth/login", 401, data=invalid_login)
        
        return True

    def test_profile_analysis(self):
        """Test profile analysis functionality"""
        print("\n=== PROFILE ANALYSIS TESTS ===")
        
        if not self.token:
            print("❌ No auth token - skipping analysis tests")
            return False

        # Test profile analysis
        profile_data = {
            "profile_name": "John Doe Test",
            "profile_bio": "Love hiking and traveling. Looking for someone special.",
            "profile_age": 28,
            "profile_location": "New York, NY",
            "dating_platform": "Tinder",
            "profile_photos_count": 5,
            "has_verified_photos": True,
            "social_media_links": ["https://instagram.com/johndoe"],
            "profile_creation_date": "2024-01-15",
            "last_active": "2024-01-20",
            "response_time": "Quick",
            "message_quality": "Personalized",
            "additional_notes": "Seems genuine but want to verify"
        }
        
        success, response = self.run_test(
            "Profile Analysis",
            "POST",
            "analyze",
            200,
            data=profile_data
        )
        
        analysis_id = None
        if success and 'id' in response:
            analysis_id = response['id']
            print(f"   Analysis ID: {analysis_id}")
            
            # Verify analysis structure
            required_fields = ['overall_score', 'trust_level', 'red_flags', 'analysis_summary']
            for field in required_fields:
                if field not in response:
                    print(f"❌ Missing field in analysis response: {field}")
                else:
                    print(f"✅ Found required field: {field}")

        # Test get all analyses
        self.run_test("Get All Analyses", "GET", "analyses", 200)
        
        # Test get specific analysis
        if analysis_id:
            self.run_test(
                "Get Specific Analysis",
                "GET",
                f"analyses/{analysis_id}",
                200
            )
            
            # Test delete analysis
            self.run_test(
                "Delete Analysis",
                "DELETE",
                f"analyses/{analysis_id}",
                200
            )
        
        # Test analysis with minimal data
        minimal_profile = {
            "profile_name": "Jane Smith"
        }
        
        self.run_test(
            "Minimal Profile Analysis",
            "POST",
            "analyze",
            200,
            data=minimal_profile
        )
        
        return True

    def test_filters_crud(self):
        """Test filters CRUD operations"""
        print("\n=== FILTERS CRUD TESTS ===")
        
        if not self.token:
            print("❌ No auth token - skipping filter tests")
            return False

        # Test create filter
        filter_data = {
            "name": "Test Filter",
            "description": "A test verification filter",
            "criteria": {
                "min_photos": 3,
                "require_verified_photos": True,
                "require_social_media": False,
                "min_profile_age_days": 7,
                "max_response_time": "24 hours"
            },
            "is_active": True
        }
        
        success, response = self.run_test(
            "Create Filter",
            "POST",
            "filters",
            200,
            data=filter_data
        )
        
        filter_id = None
        if success and 'id' in response:
            filter_id = response['id']
            print(f"   Filter ID: {filter_id}")

        # Test get all filters
        self.run_test("Get All Filters", "GET", "filters", 200)
        
        # Test update filter
        if filter_id:
            updated_filter = {
                "name": "Updated Test Filter",
                "description": "Updated description",
                "criteria": {
                    "min_photos": 5,
                    "require_verified_photos": False,
                    "require_social_media": True,
                    "min_profile_age_days": 14,
                    "max_response_time": "12 hours"
                },
                "is_active": False
            }
            
            self.run_test(
                "Update Filter",
                "PUT",
                f"filters/{filter_id}",
                200,
                data=updated_filter
            )
            
            # Test delete filter
            self.run_test(
                "Delete Filter",
                "DELETE",
                f"filters/{filter_id}",
                200
            )
        
        return True

    def test_dashboard_stats(self):
        """Test dashboard statistics"""
        print("\n=== DASHBOARD STATS TESTS ===")
        
        if not self.token:
            print("❌ No auth token - skipping stats tests")
            return False

        success, response = self.run_test("Get Dashboard Stats", "GET", "stats", 200)
        
        if success:
            # Verify stats structure
            expected_fields = ['total_analyses', 'average_score', 'trust_distribution', 'recent_analyses', 'total_filters']
            for field in expected_fields:
                if field in response:
                    print(f"✅ Found stats field: {field}")
                else:
                    print(f"❌ Missing stats field: {field}")
        
        return True

    def test_error_cases(self):
        """Test error handling"""
        print("\n=== ERROR HANDLING TESTS ===")
        
        # Test unauthorized access
        old_token = self.token
        self.token = None
        self.run_test("Unauthorized Access", "GET", "analyses", 401)
        self.token = old_token
        
        # Test invalid analysis ID
        self.run_test("Invalid Analysis ID", "GET", "analyses/invalid-id", 404)
        
        # Test invalid filter ID
        self.run_test("Invalid Filter ID", "DELETE", "filters/invalid-id", 404)
        
        # Test analysis without required field
        invalid_profile = {}
        self.run_test("Empty Profile Analysis", "POST", "analyze", 422, data=invalid_profile)
        
        return True

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Profile Verify API Tests")
        print(f"Base URL: {self.base_url}")
        
        # Run test suites
        self.test_health_check()
        
        if self.test_auth_flow():
            self.test_profile_analysis()
            self.test_filters_crud()
            self.test_dashboard_stats()
        
        self.test_error_cases()
        
        # Print final results
        print(f"\n📊 Test Results:")
        print(f"Tests run: {self.tests_run}")
        print(f"Tests passed: {self.tests_passed}")
        print(f"Tests failed: {self.tests_run - self.tests_passed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                if 'error' in test:
                    print(f"  - {test['name']}: {test['error']}")
                else:
                    print(f"  - {test['name']}: Expected {test.get('expected')}, got {test.get('actual')}")
        
        return self.tests_passed == self.tests_run

def main():
    tester = ProfileVerifyAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())