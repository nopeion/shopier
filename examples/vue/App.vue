<!--
  Vue.js ile Shopier Entegrasyonu
  
  Bu component frontend tarafıdır.
  Backend'de @nopeion/shopier kullanarak /api/create-payment endpoint'i oluşturmanız gerekir.
-->

<template>
    <div class="checkout-container">
        <h1>Checkout</h1>
        <p>Ürün: {{ productName }} ({{ amount }} TL)</p>

        <!-- Form data yokken buton göster -->
        <button v-if="!formData" @click="initiatePayment" :disabled="loading">
            {{ loading ? 'Hazırlanıyor...' : 'Shopier ile Öde' }}
        </button>

        <!-- Form data gelince formu render et ve otomatik gönder -->
        <form v-else :action="actionUrl" method="POST" ref="paymentForm">
            <input
                v-for="(value, key) in formData"
                :key="key"
                type="hidden"
                :name="key"
                :value="value"
            />
            <button type="submit">Ödeme Sayfasına Git</button>
        </form>
    </div>
</template>

<script setup>
import { ref, nextTick } from 'vue';

const props = defineProps({
    amount: { type: Number, default: 99.00 },
    productName: { type: String, default: 'Premium Plan' },
});

const loading = ref(false);
const formData = ref(null);
const actionUrl = ref('');
const paymentForm = ref(null);

const initiatePayment = async () => {
    loading.value = true;

    try {
        // Backend API'nizi çağırın
        const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                amount: props.amount,
                productName: props.productName,
            }),
        });

        const result = await response.json();

        if (result.formData) {
            formData.value = result.formData;
            actionUrl.value = result.actionUrl;

            // Otomatik form gönderimi
            await nextTick();
            paymentForm.value.submit();
        }
    } catch (error) {
        console.error('Ödeme başlatılamadı:', error);
        alert('Ödeme başlatılırken bir hata oluştu');
    } finally {
        loading.value = false;
    }
};
</script>

<style scoped>
.checkout-container {
    max-width: 400px;
    margin: 2rem auto;
    padding: 2rem;
    text-align: center;
}

button {
    background: #4CAF50;
    color: white;
    padding: 12px 24px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
}

button:disabled {
    background: #ccc;
    cursor: not-allowed;
}
</style>
