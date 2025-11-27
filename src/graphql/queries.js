/**
 * NFAEP GraphQL Queries
 */

export const getRouteJob = /* GraphQL */ `
  query GetRouteJob($jobId: ID!) {
    getRouteJob(jobId: $jobId) {
      jobId
      status
      result
      error
      createdAt
    }
  }
`;

export const getConnectMetrics = /* GraphQL */ `
  query GetConnectMetrics {
    getConnectMetrics {
      contactsInQueue
      agentsAvailable
      oldestContactAgeSeconds
      lastUpdated
    }
  }
`;

export const listAppointmentSlots = /* GraphQL */ `
  query ListAppointmentSlots(
    $filter: ModelAppointmentSlotFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listAppointmentSlots(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        siteDate
        time
        status
        clientId
        propertyId
        notes
        lastUpdated
        version
        jobNumber
        siteCode
        propertySizeHa
        address
        teamNumberFound
        estInitial
        comment
        customerName
        customerPhone
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const listFieldTeamData = /* GraphQL */ `
  query ListFieldTeamData(
    $filter: ModelFieldTeamDataFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listFieldTeamData(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        teamNumber
        teamLeader
        phone
        email
        altLeader
        altPhone
        altEmail
        area
        areaCoordinator
        areaCoordinatorEmail
        manager
        type
        depotLocation
        lastUpdated
        version
        createdAt
        updatedAt
      }
      nextToken
    }
  }
`;

export const listOptimizedRoutes = /* GraphQL */ `
  query ListOptimizedRoutes(
    $filter: ModelOptimizedRouteFilterInput
    $limit: Int
    $nextToken: String
  ) {
    listOptimizedRoutes(
      filter: $filter
      limit: $limit
      nextToken: $nextToken
    ) {
      items {
        routeId
        date
        siteId
        routeData
        summary
        createdAt
        createdBy
        jobId
        updatedAt
      }
      nextToken
    }
  }
`;
