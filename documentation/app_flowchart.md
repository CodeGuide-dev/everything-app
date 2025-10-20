flowchart TD
  U[User] --> SI[Sign In Or Sign Up]
  SI --> Auth[Authenticate User]
  Auth --> Dash[Dashboard]
  Dash --> Chat[AI Chat]
  Dash --> Search[AI Search]
  Dash --> Image[AI Image Generation]
  Chat --> ChatAPI[Chat API Endpoint]
  Search --> SearchAPI[Search API Endpoint]
  Image --> ImageAPI[Image API Endpoint]
  ChatAPI --> AiSdk[AI SDK]
  SearchAPI --> AiSdk
  ImageAPI --> AiSdk
  ChatAPI --> Db[Database]
  SearchAPI --> Db
  ImageAPI --> Db