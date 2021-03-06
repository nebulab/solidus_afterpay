$(document).bind("afterpay.loaded", function () {
  function initializeExpressCheckout(selector) {
    AfterPay.initializeForPopup({
      countryCode: "US",
      onCommenceCheckout: function (actions) {
        Spree.ajax({
          method: "POST",
          url: "/solidus_afterpay/checkouts.json",
          data: { order_number: orderNumber, mode: "express" },
          success: function (response) {
            actions.resolve(response.token);
          },
          error: function () {
            actions.reject(AfterPay.CONSTANTS.SERVICE_UNAVAILABLE);
          }
        })
      },
      onShippingAddressChange: function (data, actions) {
        Spree.ajax({
          method: "PATCH",
          url: `/solidus_afterpay/express_callbacks/${orderNumber}.json`,
          data: { address: data },
          success: function (response) {
            let results = response.data.map((shipping) =>
              shippingMethod(shipping)
            );

            if (results.length > 0) {
              actions.resolve(results);
            } else {
              actions.reject(AfterPay.CONSTANTS.SHIPPING_ADDRESS_UNSUPPORTED);
            }
          },
          error: function (error) {
            actions.reject(AfterPay.CONSTANTS.BAD_RESPONSE);
            console.error(error);
          }
        })
      },
      onComplete: function (data) {
        if (data.data.status == "SUCCESS") {
          Spree.ajax({
            method: "POST",
            url: `/solidus_afterpay/express_callbacks/${orderNumber}.json`,
            data: {
              token: data.data.orderToken,
              payment_method_id: paymentMethodId,
            },
            success: function (response) {
              window.location.href = response.redirect_url;
            },
            error: function (error) {
              const errorBody = JSON.parse(error.responseText);
              showError(errorBody.error);
            }
          })
        }
      },
      target: selector,
      buyNow: false,
      pickup: false,
      shippingOptionRequired: true,
    });
  }

  if ($("#afterpay-button").length > 0) {
    var orderNumber = $("#afterpay-button").data("order-number");
    var paymentMethodId = $("#afterpay-button").data("payment-method-id");

    initializeExpressCheckout("#afterpay-button");
  }
});

function shippingMethod(shipping) {
  return {
    id: shipping.id,
    name: shipping.name,
    description: shipping.description,
    shippingAmount: {
      amount: shipping.shipping_amount,
      currency: shipping.currency,
    },
    orderAmount: { amount: shipping.order_amount, currency: shipping.currency },
  };
}
