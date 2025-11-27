/**
 * NFAEP GraphQL Mutations
 */

export const holdSlot = /* GraphQL */ `
  mutation HoldSlot(
    $siteId: String!
    $date: AWSDate!
    $time: String!
    $expectedVersion: Int!
  ) {
    holdSlot(
      siteId: $siteId
      date: $date
      time: $time
      expectedVersion: $expectedVersion
    ) {
      siteDate
      time
      status
      version
      lastUpdated
      lockExpiresAt
    }
  }
`;

export const releaseSlot = /* GraphQL */ `
  mutation ReleaseSlot(
    $siteId: String!
    $date: AWSDate!
    $time: String!
    $expectedVersion: Int!
  ) {
    releaseSlot(
      siteId: $siteId
      date: $date
      time: $time
      expectedVersion: $expectedVersion
    ) {
      siteDate
      time
      status
      version
      lastUpdated
      lockExpiresAt
    }
  }
`;

export const bookSlot = /* GraphQL */ `
  mutation BookSlot(
    $siteId: String!
    $date: AWSDate!
    $time: String!
    $clientId: String
    $propertyId: String
    $expectedVersion: Int!
    $jobNumber: String
    $siteCode: String
    $propertySizeHa: Float
    $address: String
    $teamNumberFound: String
    $estInitial: String
    $comment: String
    $customerName: String
    $customerPhone: String
  ) {
    bookSlot(
      siteId: $siteId
      date: $date
      time: $time
      clientId: $clientId
      propertyId: $propertyId
      expectedVersion: $expectedVersion
      jobNumber: $jobNumber
      siteCode: $siteCode
      propertySizeHa: $propertySizeHa
      address: $address
      teamNumberFound: $teamNumberFound
      estInitial: $estInitial
      comment: $comment
      customerName: $customerName
      customerPhone: $customerPhone
    ) {
      siteDate
      time
      status
      clientId
      propertyId
      jobNumber
      siteCode
      propertySizeHa
      address
      teamNumberFound
      estInitial
      comment
      customerName
      customerPhone
      version
      lastUpdated
    }
  }
`;

export const completeSlot = /* GraphQL */ `
  mutation CompleteSlot(
    $siteId: String!
    $date: AWSDate!
    $time: String!
    $expectedVersion: Int!
  ) {
    completeSlot(
      siteId: $siteId
      date: $date
      time: $time
      expectedVersion: $expectedVersion
    ) {
      siteDate
      time
      status
      version
      lastUpdated
    }
  }
`;

export const rebookSlot = /* GraphQL */ `
  mutation RebookSlot(
    $siteId: String!
    $date: AWSDate!
    $time: String!
    $newDate: AWSDate!
    $newTime: String!
    $expectedVersion: Int!
  ) {
    rebookSlot(
      siteId: $siteId
      date: $date
      time: $time
      newDate: $newDate
      newTime: $newTime
      expectedVersion: $expectedVersion
    ) {
      siteDate
      time
      status
      jobNumber
      address
      customerName
      version
      lastUpdated
    }
  }
`;

export const adminOpenSlot = /* GraphQL */ `
  mutation AdminOpenSlot(
    $siteId: String!
    $date: AWSDate!
    $time: String!
  ) {
    adminOpenSlot(
      siteId: $siteId
      date: $date
      time: $time
    ) {
      siteDate
      time
      status
      version
      lastUpdated
    }
  }
`;

export const cancelSlot = /* GraphQL */ `
  mutation CancelSlot(
    $siteId: String!
    $date: AWSDate!
    $time: String!
    $expectedVersion: Int!
  ) {
    cancelSlot(
      siteId: $siteId
      date: $date
      time: $time
      expectedVersion: $expectedVersion
    ) {
      siteDate
      time
      status
      version
      lastUpdated
    }
  }
`;

export const submitRouteJob = /* GraphQL */ `
  mutation SubmitRouteJob(
    $bookings: [BookingInput!]!
    $date: AWSDate!
  ) {
    submitRouteJob(
      bookings: $bookings
      date: $date
    ) {
      jobId
      status
    }
  }
`;
