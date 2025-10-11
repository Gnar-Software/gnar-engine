export const userRoles = [
    {name: "Service Admin", role: 'service_admin'},
    {name: "Admin", role: 'admin'},
    {name: "Customer", role: 'customer'},
];

export const currencies = [
    { id: "USD", currency: "USD - US Dollar" },
    { id: "EUR", currency: "EUR - Euro" },
    { id: "GBP", currency: "GBP - British Pound" }
];

export const taxClasses = [
    { id: "standard", taxClass: "Standard Rate" },
    { id: "reduced", taxClass: "Reduced Rate" },
    { id: "zero", taxClass: "Zero Rate" }
];

export const productStatuses = [
    { id: "draft", status: "Draft" },
    { id: "published", status: "Published" },
    { id: "archived", status: "Archived" }
];

export const productCategories = [
    { id: "plugins", category: "Plugins" },
    { id: "hosting", category: "Hosting" },
    { id: "merchandise", category: "Merchandise" },
];

export const productPriceTypes = [
    { id: "recurring", type: "Recurring" },
    { id: "one-time", type: "One-time" },
];

export const productIntervals = [
    { id: "daily", interval: "Daily" },
    { id: "weekly", interval: "Weekly" },
    { id: "monthly", interval: "Monthly" },
    { id: "quarterly", interval: "Quarterly" },
    { id: "annually", interval: "Annually" },
];

export const orderTypes = [
    { id: "order", type: "Order" },
    { id: "subscription-payment", type: "Subscription" },
];

export const orderStatuses = [
    { id: "pending-payment", status: "Pending Payment" },
    { id: "processing", status: "Processing" },
    { id: "completed", status: "Completed" },
    { id: "cancelled", status: "Cancelled" },
    { id: "refunded", status: "Refunded" },
];

export const subscriptionStatuses = [
    { id: "active", status: "Active" },
    { id: "failed", status: "Failed" },
    { id: "paused", status: "Paused" },
    { id: "cancelled", status: "Cancelled" },
    { id: "expired", status: "Expired" },
    { id: "payment-due", status: "Payment Due" },
];

export const raffleStatuses = [
    { id: "draft", status: "Draft" },
    { id: "active", status: "Active" },
    { id: "closed", status: "Closed" }
];