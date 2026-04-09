const glints = { "Ice": 0.75 };
const pData = { name: "Walrein", types: ["Ice", "Water"] };
const order = { pokemon: "Walrein", totalPrice: 10 };
const profileData = { ordersCompletedCount: 5, totalSpent: 50, glintCollection: [{id: '1', type: 'bug'}] };

let typesToAward = ['normal'];
if (pData && pData.types && pData.types.length > 0) {
   typesToAward = pData.types.map(t => t.toLowerCase());
}

const updateData = {
  ordersCompletedCount: (profileData.ordersCompletedCount || 0) + 1,
  totalSpent: (profileData.totalSpent || 0) + (order.totalPrice || 0),
};

let currentCollection = profileData.glintCollection || [];
const existingKeysArray = Object.keys(glints);

typesToAward.forEach(glintType => {
  const targetKey = existingKeysArray.find(k => k.toLowerCase() === glintType) || glintType;
  
  const currentFrag = glints[targetKey] || 0;
  const newFrag = currentFrag + 0.25;
  
  if (newFrag >= 1) {
    updateData[`glintFragments.${targetKey}`] = 0;
    currentCollection = currentCollection.concat([{
      id: Math.random().toString(36).substr(2, 9),
      type: glintType,
      acquiredAt: new Date().toISOString()
    }]);
  } else {
    updateData[`glintFragments.${targetKey}`] = newFrag;
  }
});

if (currentCollection.length !== (profileData.glintCollection || []).length) {
    updateData.glintCollection = currentCollection;
}

console.log(JSON.stringify(updateData, null, 2));
