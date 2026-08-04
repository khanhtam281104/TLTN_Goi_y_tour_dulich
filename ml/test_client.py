import requests
import json
import sys

def safe_print(text):
    sys.stdout.buffer.write((str(text) + '\n').encode('utf-8'))

def test_api_chat(message):
    url = "http://localhost:5000/api/chat"
    payload = {"message": message}
    headers = {"Content-Type": "application/json"}
    
    safe_print(f"\n======================================")
    safe_print(f"TESTING CHAT: '{message}'")
    safe_print(f"======================================")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            safe_print(f"Error: Status code {response.status_code}")
            safe_print(response.text)
            return
            
        data = response.json()
        safe_print(f"Bot Response: {data.get('response')}")
        safe_print(f"Detected Intent: {data.get('intent')}")
        
        tours = data.get("tours", [])
        safe_print(f"Recommended {len(tours)} tours:")
        for idx, tour in enumerate(tours):
            safe_print(f"  {idx+1}. ID: {tour.get('id')} | {tour.get('title')}")
            safe_print(f"     Price: {tour.get('price'):,} VND ({tour.get('priceCategory')}) | Duration: {tour.get('duration')} ({tour.get('durationDays')} days) | Similarity: {tour.get('similarity'):.4f}")
    except Exception as e:
        safe_print(f"Request failed: {e}")

def test_api_recommend(query, price_category=None, max_duration=None, location=None, category=None, budget_per_person=None, num_people=1):
    url = "http://localhost:5000/api/recommend"
    payload = {
        "query": query,
        "price_category": price_category,
        "max_duration": max_duration,
        "location": location,
        "category": category,
        "budget_per_person": budget_per_person,
        "num_people": num_people
    }
    headers = {"Content-Type": "application/json"}
    
    safe_print(f"\n======================================")
    safe_print(f"TESTING EXPLICIT RECOMMEND:")
    safe_print(f"  Query: '{query}'")
    safe_print(f"  Filters: price={price_category}, duration={max_duration}, budget={budget_per_person}, people={num_people}")
    safe_print(f"======================================")
    
    try:
        response = requests.post(url, json=payload, headers=headers)
        if response.status_code != 200:
            safe_print(f"Error: Status code {response.status_code}")
            safe_print(response.text)
            return
            
        data = response.json()
        safe_print(f"Predicted Intent: {data.get('predicted_intent')}")
        
        tours = data.get("tours", [])
        safe_print(f"Recommended {len(tours)} tours:")
        for idx, tour in enumerate(tours):
            safe_print(f"  {idx+1}. ID: {tour.get('id')} | {tour.get('title')}")
            safe_print(f"     Price: {tour.get('price'):,} VND ({tour.get('priceCategory')}) | Duration: {tour.get('duration')} ({tour.get('durationDays')} days) | Similarity: {tour.get('similarity'):.4f}")
    except Exception as e:
        safe_print(f"Request failed: {e}")

if __name__ == "__main__":
    safe_print("Starting AI Recommendation API Client Tests...")
    
    # Test 1: Chatbot general intent matching
    test_api_chat("Tôi muốn đi du lịch Phú Quốc")
    
    # Test 2: Chatbot budget parsing (single person)
    test_api_chat("tôi có 5 triệu thì nên đi đâu?")
    
    # Test 3: Chatbot budget parsing for multiple people (group budget division)
    test_api_chat("chúng tôi có 12 triệu cho 4 người muốn đi du lịch")
    
    # Test 4: Chatbot budget + semantic keyword filtering
    test_api_chat("tôi muốn đi du lịch biển có 5 triệu")
    
    # Test 5: Explicit recommendation endpoint
    test_api_recommend(
        query="Sapa",
        budget_per_person=4000000,
        num_people=1
    )
