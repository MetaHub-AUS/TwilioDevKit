# NFAEP Agent Workspace

**National Fire Ant Eradication Program - Estimation & Scheduling Tool**

A comprehensive agent workspace and field operations management system built with React, AWS Amplify, and Amazon Bedrock AI.

## 🎯 Features

### Agent Workspace
- **📡 Command Center**: Appointment slot booking with grid/table toggle views
- **🤖 AI Intelligence**: Real-time AI predictions for optimal booking times
- **📞 Amazon Connect Integration**: Embedded Contact Control Panel (CCP)
- **📋 Post-Call Surveys**: Smart survey capture system

### Field Operations Dashboard
- **🚁 Field Assets**: Real-time team tracking and status monitoring
- **🧭 Route Planner**: AI-powered route optimization using Amazon Bedrock
- **📄 PDF Generation**: Automated route timeline PDF reports
- **📅 Date Management**: Brisbane timezone-aware scheduling

### Advanced Capabilities
- **Real-time DataStore Sync**: AWS Amplify DataStore for offline-first capabilities
- **Optimistic Locking**: Prevents booking conflicts with version control
- **Role-Based Access**: Agent vs Field Leader permissions
- **Slot State Machine**: OPEN → HOLD → BOOKED → COMPLETED → NEEDS_REBOOK

## 🏗️ Architecture

### Frontend (React)
```
src/
├── components/
│   ├── field/FieldDashboard.js     # Route planning & optimization
│   ├── revisit/RevisitTable.js     # Grid/Table booking views
│   ├── connect/CCPContainer.js     # Amazon Connect CCP
│   ├── auth/AuthWrapper.js         # Authentication provider
│   └── ...
├── utils/
│   ├── generateRoutePDF.js         # jsPDF route generation
│   ├── dateHelpers.js              # Brisbane timezone utilities
│   └── mockDataStore.js            # Development mock data
├── graphql/
│   ├── mutations.js                # GraphQL mutations
│   └── queries.js                  # GraphQL queries
└── configureAmplify.js             # Amplify configuration
```

### Backend (AWS Amplify)
```
amplify/backend/
├── api/nfaepapi/schema.graphql     # GraphQL schema
└── function/
    ├── nfaepSlotMutations/         # Slot state transitions
    ├── nfaepRouteOptimizer/        # Submit route jobs
    ├── nfaepRouteProcessor/        # Bedrock AI optimization
    ├── nfaepGetRouteJob/           # Poll job status
    └── nfaepContactMetrics/        # Amazon Connect metrics
```

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- AWS Account with Amplify CLI configured
- Amazon Bedrock access (for route optimization)
- Amazon Connect instance (optional, for CCP)

### Setup Steps

1. **Clone and Install Dependencies**
```bash
git clone <repository-url>
cd ESTBackUp
npm install
```

2. **Configure Environment Variables**
Create a `.env` file:
```env
REACT_APP_AWS_REGION=ap-southeast-2
REACT_APP_GRAPHQL_ENDPOINT=<your-appsync-endpoint>
REACT_APP_API_KEY=<your-api-key>
REACT_APP_USER_POOL_ID=<your-cognito-pool-id>
REACT_APP_USER_POOL_CLIENT_ID=<your-cognito-client-id>
```

3. **Initialize Amplify Backend**
```bash
amplify init
amplify push
```

4. **Deploy Lambda Functions**
```bash
# Install Lambda dependencies
cd amplify/backend/function/nfaepSlotMutations/src && npm install
cd amplify/backend/function/nfaepRouteOptimizer/src && npm install
cd amplify/backend/function/nfaepRouteProcessor/src && npm install
cd amplify/backend/function/nfaepGetRouteJob/src && npm install
cd amplify/backend/function/nfaepContactMetrics/src && npm install

# Deploy
amplify push function
```

5. **Configure Lambda Environment Variables**

For **nfaepRouteProcessor**:
```bash
DEPOT_ADDRESS=NFAEP Depot, Brisbane
DEPOT_LAT=-27.4698
DEPOT_LNG=153.0251
ROUTE_JOBS_TABLE=NFAEPRouteJobs
OPTIMIZED_ROUTE_TABLE=OptimizedRoute-<env>
```

For **nfaepContactMetrics** (optional):
```bash
CONNECT_INSTANCE_ID=<your-connect-instance-id>
CONNECT_QUEUE_ARNS=<comma-separated-queue-arns>
```

6. **Create DynamoDB RouteJobs Table**
```bash
aws dynamodb create-table \
  --table-name NFAEPRouteJobs \
  --attribute-definitions \
      AttributeName=jobId,AttributeType=S \
  --key-schema \
      AttributeName=jobId,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --stream-specification StreamEnabled=true,StreamViewType=NEW_AND_OLD_IMAGES
```

7. **Connect DynamoDB Stream to RouteProcessor**
```bash
# Get stream ARN
aws dynamodb describe-table --table-name NFAEPRouteJobs | grep StreamArn

# Add trigger to Lambda function
aws lambda create-event-source-mapping \
  --function-name nfaepRouteProcessor-<env> \
  --event-source-arn <stream-arn> \
  --starting-position LATEST
```

## 🚀 Running the Application

### Development Mode
```bash
npm start
```
Runs on http://localhost:3000

### Production Build
```bash
npm run build
```

## 🎨 User Interface

### View Modes

**Agent View (Default)**
- 3-column layout: CCP | Booking Center | AI & Surveys
- Grid/Table toggle for appointment slots
- Real-time slot availability

**Field Leader View**
- Field Assets: Team status monitoring
- Route Planner: AI-optimized route generation
- PDF export for route timelines

### Switching Roles
Use the "View As" dropdown in the header to switch between Agent and Field Leader roles.

## 🔧 Key Components

### AppointmentSlot Model
```javascript
{
  siteDate: "site#goldcoast#2025-11-27",  // Composite key
  time: "07:30",                           // Sort key
  status: "BOOKED | OPEN | HOLD | ...",
  customerName: "John Smith",
  customerPhone: "0411222333",
  address: "123 Main St",
  propertySizeHa: 2.5,
  teamNumberFound: "60",
  version: 1                               // Optimistic locking
}
```

### Route Optimization Flow
1. Select booked appointments in FieldDashboard
2. Click "Optimize Routes"
3. Submit job → `nfaepRouteOptimizer` creates PENDING record
4. DynamoDB Stream triggers `nfaepRouteProcessor`
5. Processor invokes Bedrock Claude (Sonnet 3.5)
6. Optimized routes cached in OptimizedRoute table
7. Generate PDF with timeline visualization

## 📊 Data Models

### Core Models
- **AppointmentSlot**: Booking slots with composite key (siteDate + time)
- **FieldTeamData**: Team information and contact details
- **OptimizedRoute**: Cached route optimization results

### Slot Status States
```
OPEN → HOLD → BOOKED → COMPLETED
              ↓
        NEEDS_REBOOK
```

## 🔐 Security

- **AWS Cognito**: User authentication
- **Cognito Groups**: Role-based access (Agents, FieldLeaders, Admins)
- **AppSync API Key**: Development mode
- **IAM Roles**: Production Lambda execution

## 🧪 Testing

### Mock Data Mode
The application runs with mock data when AWS backend is not configured:
- Mock appointment slots
- Mock team data
- Simulated booking operations

### Enable Production Mode
Set environment variables in `.env` to connect to AWS resources.

## 📝 Development Notes

### Important TODOs
Throughout the codebase, look for `// TODO:` comments indicating areas to replace mock data with real AWS calls:

- `RevisitTable.js:28-30`: Replace mock slots with DataStore query
- `FieldDashboard.js:38-40`: Replace mock jobs with DataStore query
- `RevisitTable.js:50-61`: Uncomment real bookSlot mutation

### Date Handling
All date utilities use Brisbane timezone (`Australia/Brisbane`):
```javascript
import { getBrisbaneDate, toAwsDate, toDisplayDate } from './utils/dateHelpers';
```

### Composite Keys
Site-date composite keys format: `site#<normalized-site-id>#<date>`
```javascript
createSiteDate("Gold Coast", "2025-11-27") // → "site#goldcoast#2025-11-27"
```

## 🛠️ Troubleshooting

### Common Issues

**Amplify not configured**
- Check `.env` file exists and contains valid AWS credentials
- Verify `amplify init` has been run

**Lambda function errors**
- Check Lambda CloudWatch logs
- Verify environment variables are set
- Ensure IAM roles have correct permissions

**Route optimization fails**
- Confirm Bedrock model access: `anthropic.claude-3-5-sonnet-20241022-v2:0`
- Check Lambda timeout (increase if needed)
- Verify DynamoDB Stream is connected

**PDF generation not working**
- Check browser console for jsPDF errors
- Ensure route data structure matches expected format

## 📚 Additional Resources

- [AWS Amplify Documentation](https://docs.amplify.aws/)
- [Amazon Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [Amazon Connect Documentation](https://docs.aws.amazon.com/connect/)
- [jsPDF Documentation](https://github.com/parallax/jsPDF)

## 📄 License

Proprietary - National Fire Ant Eradication Program

## 👥 Support

For issues and questions, contact the NFAEP development team.

---

**Built with ❤️ for the National Fire Ant Eradication Program**
