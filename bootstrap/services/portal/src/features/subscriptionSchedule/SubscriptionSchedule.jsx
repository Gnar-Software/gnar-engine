const SubscriptionSchedule = ({subscription, onChange, formData}) => {

    return (
        <div className="card">
            <div className='card-header'>
                <h2>Subscription Schedule</h2>
            </div>
            <div className='card-content'>
                <div className="subscription-schedule-cont">
                    <div className="subscription-schedule-body">
                        {subscription ? (
                            <div>
                                <p><strong>Payment Interval:</strong> {subscription.paymentInterval.interval}</p>
                                <p><strong>Interval Count:</strong> {subscription.paymentInterval.intervalCount}</p>
                                <p><strong>Trial Period:</strong> {subscription.trialPeriodDays || '0'}</p>
                                <p><strong>Next Payment Date:</strong>
                                    <input 
                                        type="text" 
                                        name="billingNextScheduled" 
                                        value={formData.billingNextScheduled || ''} 
                                        onChange={(e) => onChange(e)} 
                                    />
                                </p>

                                <p><strong>Retry attempt</strong>
                                    <input 
                                        type="number" 
                                        name="retryAttempt" 
                                        value={formData.retryAttempt || 0} 
                                        onChange={(e) => onChange(e)} 
                                    />
                                </p>
                            </div>
                        ) : (
                            <p>No subscription details available.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SubscriptionSchedule;