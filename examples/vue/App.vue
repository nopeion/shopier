<template>
  <div class="checkout-container">
    <h1>Checkout</h1>
    <p>Product: {{ productName }} ({{ amount }} TRY)</p>
    <button :disabled="loading" @click="startCheckout">
      {{ loading ? 'Preparing…' : 'Pay with Shopier' }}
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
  amount: { type: Number, default: 99 },
  productName: { type: String, default: 'Premium Plan' },
});

const loading = ref(false);

async function startCheckout() {
  loading.value = true;

  try {
    const response = await fetch('/api/shopier/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ amount: String(props.amount), title: props.productName }),
    });

    if (!response.ok) throw new Error('Checkout could not be created.');

    document.open();
    document.write(await response.text());
    document.close();
  } catch (error) {
    console.error('Checkout error:', error);
    alert('Checkout could not be started.');
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.checkout-container { max-width: 400px; margin: 2rem auto; padding: 2rem; text-align: center; }
button { background: #4caf50; border: 0; border-radius: 4px; color: white; cursor: pointer; font-size: 16px; padding: 12px 24px; }
button:disabled { background: #ccc; cursor: not-allowed; }
</style>
