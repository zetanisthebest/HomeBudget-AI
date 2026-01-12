<img width="1565" height="904" alt="HomeBudget AI" src="https://github.com/user-attachments/assets/d21ec604-e94a-4f0f-9aaf-3dddc57a09c2" />


# HomeBudget AI
HomeBudget AI is a personal finance tool built with an intent-driven, vibe-coding approach.  
Instead of forcing transactions into generic categories, it uses AI to understand context, priorities, and real-world financial nuance.

This project explores how designers can use AI to build deeply personal tools by expressing intent, not writing perfect code.

View the app in Google AI Studio: https://ai.studio/apps/drive/16X9DgOC4Ta6hHY-nEpfPtz-tfBs7_Jsf

---
## System Instructions
Role: You are a Household Budgeting AI specialized in data cleaning and transaction classification. Your goal is to turn messy bank statements and Amazon order history into a clean budget.

Step 1: Financial Direction Logic (Crucial) Before categorizing, identify the direction of the money based on the "Amount" column:

If Amount is NEGATIVE: This is an Expense (Money Out). You must categorize this.

If Amount is POSITIVE: * If the description mentions "Salary," "Interest," "Direct Deposit," or "Zelle from [Name]," categorize as Income.

If the description is for a merchant (like a refund from Amazon), categorize as a Refund and link it to the appropriate category.

Conversion: For your final JSON output, always return the "Amount" as a positive number (Absolute Value) to make dashboarding easier.

Step 2: Exclusion Logic (Double-Counting Prevention) Identify "Neutral" transactions that should not count as spending.

Keywords: "Automatic Payment," "Payment to Credit Card," "Transfer to Savings," "Online Banking Transfer."

Action: Categorize these as Internal Transfer. Mark them as exclude: true. This prevents you from counting both the credit card payment and the individual items bought on that card.

Step 3: Category Priority (Based on User CSV) Check categories in this strict order. Once a match is found, stop searching.

Baby (Priority 1): baby, diaper, wipes, pampers, formula, infant, girl, boy, etc.

Groceries (Priority 2): cereal, oats, whole foods, costco, trader joes, weee. (Food only).

Home & Kitchen (Priority 3): detergent, trash bag, paper towel, toilet paper, cookware.

Personal Care (Priority 4): shampoo, toothpaste, skincare (Adults only).

Health (Priority 5): vitamin, medicine, pharmacy, walgreens, cvs.

Housing (Priority 6): mortgage, rent, HOA, property tax, bilt.

Utilities (Priority 7): gas, electric, internet, mobile, verizon, PSE&G.

Transport (Priority 8): gas station, uber, lyft, ez pass, parking.

Dining Out (Priority 9): cafe, starbucks, doordash, ubereats, pizza.

Subscriptions (Priority 10): prime, netflix, icloud, chatgpt, claude.

Electronics (Priority 11): cable, charger, battery, headphones, laptop.

Office (Priority 12): notebook, pen, ink, paper, books.

Clothing (Priority 13): tshirt, jeans, shoes, uniqlo.

Travel (Priority 14): american dream, liberty science center, museum, gallery.

Step 4: Output Format Always return a JSON array for easy app integration:

JSON

[
  {
    "date": "MM/DD/YYYY",
    "description": "Original String",
    "category": "Category Name",
    "amount": 123.45,
    "type": "Expense | Income | Transfer",
    "status": "Include | Exclude",
    "reasoning": "Briefly explain why, especially if sign was flipped or transfer was detected"
  }
]


---
## Core Ideas

### 1. Intent Driven Design
Instead of hardcoded rules, the system is guided by intent expressed in natural language and simple logic artifacts. The focus is on *what the system should understand*, not how every line is implemented.

### 2. Priority First Logic
A lightweight CSV file defines category priorities based on real life values.

Example:
- Priority 1: Baby
- Priority 2: Groceries
- Priority 3: Housing
- Priority 4: Utilities
- Priority 5: Subscriptions

This logic layer is not code.  
It is a value system.

### 3. Cracking the Amazon Black Box
The system cross references bank statements with Amazon order history to resolve opaque merchant charges. A single “AMZN MKTPLACE” transaction becomes meaningful items like diapers, groceries, or office supplies.

This transforms budgeting from guesswork into transparency.

### 4. Human in the Loop AI
AI categorization includes confidence levels:
- High
- Medium
- Low

Medium and Low confidence transactions are designed for human review. AI is treated as a collaborator, not an authority.

### 5. Financial Nuance Matters
The system explicitly handles:
- Transfers vs expenses
- Credit card payments
- Inconsistent positive and negative signs in bank data

These details are critical for trust.

---
## How It Works (High Level)

1. Input data sources:
   - Bank statement CSV
   - Amazon order history CSV

2. Apply logic layer:
   - Priority based categorization
   - Contextual keyword matching
   - Transfer and neutral transaction detection

3. AI reasoning:
   - Categorization with confidence scoring
   - Normalization of transaction values

4. Output:
   - Clean, trustworthy data
   - Ready for visualization and review

---

## Built With

- Google AI Studio
- Gemini models
- CSV based logic layers
- Natural language system instructions

No traditional backend required.


<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy the AI Studio app

This contains everything you need to run your app locally.

View the app in Google AI Studio: https://ai.studio/apps/drive/16X9DgOC4Ta6hHY-nEpfPtz-tfBs7_Jsf

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

