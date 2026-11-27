import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { mcpOauth } from "../../services/mcpOauth";
import { getAuthUser } from "../../services/storage";
import gnarEngineLogo from '../../assets/gnar-engine-white-logo.svg';

function OAuthConsentPage() {

    const [searchParams] = useSearchParams();
    const transactionId = searchParams.get('transactionId');
    const authUser = JSON.parse(getAuthUser() || '{}');

    const [transaction, setTransaction] = useState(null);
    const [hasError, setHasError] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // load the sign-in request
    useEffect(() => {
        mcpOauth.getTransaction({ id: transactionId })
            .then(({ oauthTransaction }) => {
                if (oauthTransaction.isCompleted) {
                    setHasError(true);
                    return;
                }
                setTransaction(oauthTransaction);
            })
            .catch(() => setHasError(true));
    }, [transactionId]);

    // send the decision, then go back to the app
    const handleDecision = async (decision) => {
        setIsSubmitting(true);

        try {
            const { redirectTo } = await mcpOauth.completeTransaction({ id: transactionId, decision });
            window.location.assign(redirectTo);
        } catch (error) {
            setHasError(true);
        }
    }

    return (
        <div className="login-page oauth-consent-page flex-row">
            <div className="login-left-panel">
                <img src={gnarEngineLogo} className="logo" alt="Gnar Engine" />
            </div>
            <div className="login-right-panel">
                <div className="oauth-consent">
                    {hasError && (
                        <p>This sign-in link has expired or was already used. Start again from your app.</p>
                    )}

                    {!hasError && transaction && (
                        <>
                            <h1>{transaction.clientName} wants to use Gnar tools as {authUser.email}</h1>

                            <dl className="oauth-consent-details">
                                <dt>App</dt>
                                <dd>{transaction.clientName} ({transaction.clientIdHost})</dd>
                                <dt>Sends you back to</dt>
                                <dd>{transaction.isLoopbackRedirect ? 'an app on this computer' : transaction.redirectHost}</dd>
                                <dt>Access</dt>
                                <dd>{transaction.scope}</dd>
                            </dl>

                            <div className="oauth-consent-actions">
                                <button type="button" disabled={isSubmitting} onClick={() => handleDecision('allow')}>Allow</button>
                                <button type="button" className="secondary-btn" disabled={isSubmitting} onClick={() => handleDecision('deny')}>Deny</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default OAuthConsentPage;
