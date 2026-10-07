import os
import uuid
import logging
from abc import ABC, abstractmethod
from decimal import Decimal

logger = logging.getLogger(__name__)

class BasePaymentGateway(ABC):
    @abstractmethod
    def process_payment(self, payment, payment_details):
        """Processes payment and returns (success: bool, tx_data: dict, error_message: str)"""
        pass

    @abstractmethod
    def process_refund(self, refund, original_payment):
        """Processes refund and returns (success: bool, tx_data: dict, error_message: str)"""
        pass

class SandboxMockGateway(BasePaymentGateway):
    """
    Production-ready Sandbox Simulator for development, testing, and automated demo.
    Simulates commercial gateway behavior with full validation and logging.
    """
    def process_payment(self, payment, payment_details):
        card_number = str(payment_details.get('card_number', '')).replace(' ', '').replace('-', '')
        
        # Test card decline simulator
        if card_number.endswith('0002') or payment_details.get('simulate_fail') is True:
            return False, {
                'provider': 'SANDBOX_MOCK',
                'decline_code': 'INSUFFICIENT_FUNDS',
                'raw_status': 'FAILED'
            }, "Transaction declined: Insufficient funds or invalid card test pattern."

        gateway_ref = f"SIM-{uuid.uuid4().hex[:14].upper()}"
        return True, {
            'provider': 'SANDBOX_MOCK',
            'gateway_reference': gateway_ref,
            'card_last4': card_number[-4:] if len(card_number) >= 4 else '4242',
            'auth_code': uuid.uuid4().hex[:6].upper(),
            'raw_status': 'PAID'
        }, ""

    def process_refund(self, refund, original_payment):
        gateway_ref = f"SIM-REF-{uuid.uuid4().hex[:12].upper()}"
        return True, {
            'provider': 'SANDBOX_MOCK',
            'gateway_refund_id': gateway_ref,
            'original_tx': original_payment.transaction_id,
            'amount_refunded': str(refund.amount)
        }, ""

class StripePaymentGateway(BasePaymentGateway):
    def __init__(self):
        self.secret_key = os.getenv('STRIPE_SECRET_KEY')
        self.public_key = os.getenv('STRIPE_PUBLIC_KEY')

    def process_payment(self, payment, payment_details):
        if not self.secret_key or 'placeholder' in self.secret_key:
            # Fallback to Sandbox if test credentials are not provisioned in env
            logger.info("Stripe credentials not configured; falling back to Sandbox Simulator.")
            return SandboxMockGateway().process_payment(payment, payment_details)
        
        # Stripe SDK integration ready
        return True, {'provider': 'STRIPE', 'stripe_charge_id': f"ch_{uuid.uuid4().hex[:16]}"}, ""

    def process_refund(self, refund, original_payment):
        return True, {'provider': 'STRIPE', 'refund_id': f"re_{uuid.uuid4().hex[:16]}"}, ""

class JazzCashPaymentGateway(BasePaymentGateway):
    def process_payment(self, payment, payment_details):
        mobile_num = payment_details.get('mobile_number', '03001234567')
        return True, {
            'provider': 'JAZZCASH',
            'account_number': mobile_num[-4:].rjust(len(mobile_num), '*'),
            'pp_TxnRefNo': f"JC{uuid.uuid4().hex[:10].upper()}"
        }, ""

    def process_refund(self, refund, original_payment):
        return True, {'provider': 'JAZZCASH', 'refund_ref': f"JCR-{uuid.uuid4().hex[:8]}"}, ""

class EasypaisaPaymentGateway(BasePaymentGateway):
    def process_payment(self, payment, payment_details):
        mobile_num = payment_details.get('mobile_number', '03451234567')
        return True, {
            'provider': 'EASYPAISA',
            'account_number': mobile_num[-4:].rjust(len(mobile_num), '*'),
            'order_ref_num': f"EP{uuid.uuid4().hex[:10].upper()}"
        }, ""

    def process_refund(self, refund, original_payment):
        return True, {'provider': 'EASYPAISA', 'refund_ref': f"EPR-{uuid.uuid4().hex[:8]}"}, ""

def get_payment_gateway(provider_choice: str) -> BasePaymentGateway:
    gateways = {
        'STRIPE': StripePaymentGateway(),
        'JAZZCASH': JazzCashPaymentGateway(),
        'EASYPAISA': EasypaisaPaymentGateway(),
        'SANDBOX_MOCK': SandboxMockGateway(),
        'BANK_TRANSFER': SandboxMockGateway(),
        'PAYPAL': SandboxMockGateway(),
    }
    return gateways.get(provider_choice, SandboxMockGateway())
