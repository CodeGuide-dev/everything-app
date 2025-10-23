flowchart TD
A[User visits app] --> B[Sign In Page]
B --> C{Authenticated?}
C -- Yes --> D[Dashboard]
C -- No --> B
D --> E[Chat Page]
E --> F[User sends message]
F --> G[API Chat Route]
G --> H[AI SDK Interaction]
G --> I[Store messages in DB]
H --> J[AI Streaming Response]
J --> E
D --> K[API Key Manager]
K --> L[API Keys API Route]
L --> I
D --> M[Sign Out]
M --> B