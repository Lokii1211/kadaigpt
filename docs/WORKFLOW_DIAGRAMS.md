# KadaiGPT Workflow Diagrams

Use these diagrams in Mermaid Live Editor (https://mermaid.live) or draw.io to generate proper diagrams.

---

## 1. System Architecture Diagram

```mermaid
flowchart LR
    subgraph Users
        A[👤 Store Owner]
        B[👥 Customer]
    end
    
    subgraph Frontend["React Frontend"]
        C[Dashboard]
        D[Create Bill]
        E[Products]
        F[Analytics]
    end
    
    subgraph Backend["FastAPI Backend"]
        G[Auth Service]
        H[Bills API]
        I[Products API]
        J[Customers API]
        K[Analytics API]
    end
    
    subgraph ML["ML Models"]
        L[Price Prediction]
        M[Demand Forecast]
        N[OCR Engine]
    end
    
    subgraph Database["PostgreSQL"]
        O[(Bills)]
        P[(Products)]
        Q[(Customers)]
        R[(Analytics)]
    end
    
    subgraph Bots
        S[WhatsApp Bot]
        T[Telegram Bot]
    end
    
    A --> C
    B --> D
    C --> G
    D --> H
    E --> I
    F --> K
    
    H --> O
    I --> P
    J --> Q
    K --> R
    
    K --> L
    K --> M
    H --> N
    
    S --> H
    T --> H
```

---

## 2. Billing Process Flowchart

```mermaid
flowchart TD
    A([START]) --> B[Add Products to Cart]
    B --> C[Enter Customer Phone]
    C --> D{Customer Exists?}
    D -->|YES| E[Update Loyalty Points]
    D -->|NO| F[Create New Customer]
    E --> G[Select Payment Method]
    F --> G
    G --> H{Payment Type}
    H -->|Cash| I[Process Cash Payment]
    H -->|UPI| J[Process UPI Payment]
    H -->|Card| K[Process Card Payment]
    H -->|Credit| L[Add to Customer Credit]
    I --> M[Generate Invoice]
    J --> M
    K --> M
    L --> M
    M --> N[Update Stock in Database]
    N --> O[Calculate Loyalty Points]
    O --> P[Send Bill to WhatsApp]
    P --> Q([END])
```

---

## 3. Data Flow Diagram

```mermaid
flowchart LR
    subgraph Input
        U[User Request]
    end
    
    subgraph Processing
        A[API Gateway]
        B[Authentication]
        C[Business Logic]
    end
    
    subgraph Services
        D[Bills Service]
        E[Products Service]
        F[Customers Service]
        G[Analytics Service]
    end
    
    subgraph Storage
        H[(PostgreSQL)]
        I[(Redis Cache)]
    end
    
    subgraph Output
        J[JSON Response]
        K[WhatsApp Message]
    end
    
    U --> A
    A --> B
    B --> C
    C --> D
    C --> E
    C --> F
    C --> G
    D --> H
    E --> H
    F --> H
    G --> H
    G --> I
    D --> J
    D --> K
```

---

## 4. User Journey Diagram

```mermaid
journey
    title KadaiGPT User Journey
    section Registration
      Sign Up: 5: Store Owner
      Add Store Details: 4: Store Owner
      Verify Phone: 3: Store Owner
    section Setup
      Add Products: 5: Store Owner
      Set Prices: 4: Store Owner
      Configure GST: 3: Store Owner
    section Daily Use
      Create Bills: 5: Store Owner
      Track Sales: 5: Store Owner
      View Analytics: 4: Store Owner
    section Growth
      Use AI Predictions: 5: Store Owner
      Send Reminders: 4: Store Owner
      Grow Business: 5: Store Owner
```

---

## 5. Database Schema

```mermaid
erDiagram
    STORES ||--o{ USERS : has
    STORES ||--o{ PRODUCTS : has
    STORES ||--o{ BILLS : has
    STORES ||--o{ CUSTOMERS : has
    
    BILLS ||--o{ BILL_ITEMS : contains
    PRODUCTS ||--o{ BILL_ITEMS : referenced_in
    CUSTOMERS ||--o{ BILLS : makes
    
    STORES {
        int id PK
        string name
        string address
        string gstin
    }
    
    USERS {
        int id PK
        int store_id FK
        string email
        string password_hash
        string role
    }
    
    PRODUCTS {
        int id PK
        int store_id FK
        string name
        float price
        int stock
        string category
    }
    
    BILLS {
        int id PK
        int store_id FK
        int customer_id FK
        string bill_number
        float total
        string payment_method
        datetime created_at
    }
    
    CUSTOMERS {
        int id PK
        int store_id FK
        string name
        string phone
        float credit
        int loyalty_points
    }
    
    BILL_ITEMS {
        int id PK
        int bill_id FK
        int product_id FK
        int quantity
        float unit_price
        float total
    }
```

---

## How to Use

1. Go to https://mermaid.live
2. Paste any diagram code above
3. Export as PNG/SVG
4. Add to your PPT

Or use draw.io (https://app.diagrams.net) for more customization.
