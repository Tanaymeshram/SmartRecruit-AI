# Comprehensive Technical & Professional Skills Taxonomy

SKILL_TAXONOMY = {
    "Programming Languages": [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "C", "Go", "Rust", "Ruby",
        "PHP", "Swift", "Kotlin", "Scala", "R", "Dart", "Shell", "Bash", "SQL", "HTML", "CSS"
    ],
    "Frameworks & Libraries": [
        "React", "Next.js", "Vue.js", "Angular", "Node.js", "Express.js", "FastAPI", "Django",
        "Flask", "Spring Boot", "ASP.NET", "Ruby on Rails", "Tailwind CSS", "Bootstrap",
        "Redux", "GraphQL", "REST APIs", "gRPC", "WebSockets"
    ],
    "Databases & Storage": [
        "PostgreSQL", "MySQL", "MongoDB", "Redis", "SQLite", "Cassandra", "DynamoDB",
        "Elasticsearch", "ChromaDB", "Neo4j", "Firebase", "Supabase", "Snowflake"
    ],
    "AI, Machine Learning & Data": [
        "Machine Learning", "Deep Learning", "Natural Language Processing", "NLP", "Computer Vision",
        "TensorFlow", "PyTorch", "Keras", "Scikit-Learn", "Pandas", "NumPy", "SciPy",
        "Hugging Face", "Transformers", "Sentence Transformers", "LangChain", "LlamaIndex",
        "RAG", "LLMs", "Vector Databases", "Prompt Engineering", "Fine-Tuning", "spaCy"
    ],
    "Cloud & DevOps": [
        "AWS", "Google Cloud", "Azure", "Docker", "Kubernetes", "Terraform", "CI/CD",
        "GitHub Actions", "GitLab CI", "Jenkins", "Linux", "Nginx", "Apache", "Ansible",
        "Prometheus", "Grafana", "Serverless", "Microservices"
    ],
    "Software Engineering & Tools": [
        "Git", "GitHub", "GitLab", "Jira", "Agile", "Scrum", "TDD", "Unit Testing",
        "Pytest", "Jest", "Cypress", "Postman", "Swagger", "System Design", "OOP"
    ],
    "Data Engineering & Big Data": [
        "Apache Spark", "Apache Kafka", "Airflow", "Hadoop", "ETL", "Data Pipelines",
        "dbt", "BigQuery", "Data Warehousing"
    ]
}

# Skill aliases mapping variations to canonical names
SKILL_ALIASES = {
    "reactjs": "React",
    "react.js": "React",
    "nextjs": "Next.js",
    "next.js": "Next.js",
    "vue": "Vue.js",
    "vuejs": "Vue.js",
    "nodejs": "Node.js",
    "node.js": "Node.js",
    "express": "Express.js",
    "expressjs": "Express.js",
    "fastapi": "FastAPI",
    "django": "Django",
    "flask": "Flask",
    "postgres": "PostgreSQL",
    "psql": "PostgreSQL",
    "k8s": "Kubernetes",
    "golang": "Go",
    "py": "Python",
    "ts": "TypeScript",
    "js": "JavaScript",
    "es6": "JavaScript",
    "scikit learn": "Scikit-Learn",
    "sklearn": "Scikit-Learn",
    "pytorch": "PyTorch",
    "tensorflow": "TensorFlow",
    "tf": "TensorFlow",
    "llm": "LLMs",
    "large language models": "LLMs",
    "rag": "RAG",
    "retrieval augmented generation": "RAG",
    "gcp": "Google Cloud",
    "google cloud platform": "Google Cloud",
    "amazon web services": "AWS",
    "elastic search": "Elasticsearch",
    "mongo": "MongoDB",
    "tailwind": "Tailwind CSS",
    "ci cd": "CI/CD",
    "cicd": "CI/CD",
    "gh actions": "GitHub Actions",
    "nlp": "NLP",
    "spacy": "spaCy"
}

# Reverse mapping: skill -> related skills for intelligent matching
SKILL_RELATIONS = {
    "React": ["Next.js", "TypeScript", "JavaScript", "Redux", "Tailwind CSS"],
    "Next.js": ["React", "TypeScript", "Node.js", "Tailwind CSS"],
    "FastAPI": ["Python", "Pydantic", "Docker", "PostgreSQL", "REST APIs"],
    "Django": ["Python", "PostgreSQL", "Redis", "REST APIs", "Docker"],
    "Flask": ["Python", "REST APIs", "Docker", "PostgreSQL"],
    "Python": ["FastAPI", "Django", "Machine Learning", "Pandas", "NumPy", "Pytest"],
    "Machine Learning": ["Python", "Scikit-Learn", "PyTorch", "TensorFlow", "Pandas", "NumPy"],
    "RAG": ["LLMs", "Vector Databases", "ChromaDB", "LangChain", "Sentence Transformers", "Python"],
    "LLMs": ["RAG", "Prompt Engineering", "Fine-Tuning", "LangChain", "Transformers", "Python"],
    "Docker": ["Kubernetes", "CI/CD", "Linux", "AWS", "Microservices"],
    "Kubernetes": ["Docker", "Terraform", "CI/CD", "AWS", "Google Cloud", "Microservices"],
    "PostgreSQL": ["SQL", "Redis", "Database Design", "Backend Development"],
    "MongoDB": ["NoSQL", "Express.js", "Node.js", "Backend Development"],
    "AWS": ["Docker", "Kubernetes", "Terraform", "Serverless", "CI/CD"]
}

