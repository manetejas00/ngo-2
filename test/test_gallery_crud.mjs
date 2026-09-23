// Using native global fetch available in Node 18+

async function runGalleryTests() {
  const baseUrl = 'http://localhost:3000';
  console.log('🧪 Running Gallery API & Admin CRUD Integration Tests...\n');

  // Test 1: Public GET /api/gallery
  console.log('1️⃣ Fetching public gallery items via GET /api/gallery...');
  const publicRes = await fetch(`${baseUrl}/api/gallery`);
  if (!publicRes.ok) {
    throw new Error(`GET /api/gallery failed with status ${publicRes.status}`);
  }
  const publicJson = await publicRes.json();
  const publicData = Array.isArray(publicJson) ? publicJson : (publicJson.data || []);
  console.log(`   ✅ Received ${publicData.length} public gallery items.`);
  if (!Array.isArray(publicData) || publicData.length === 0) {
    throw new Error('Expected non-empty array of seeded gallery items!');
  }

  // Verify sample item properties
  const sampleItem = publicData[0];
  console.log('   Sample Item:', {
    id: sampleItem.id || sampleItem.gallery_id,
    title: sampleItem.title,
    category: sampleItem.category,
    has_details: sampleItem.has_details,
    is_published: sampleItem.is_published
  });

  // Test 2: Admin Authentication Token
  console.log('\n2️⃣ Using Admin bearer token AVG-ADM-TEST-TOKEN-2026...');
  const token = 'AVG-ADM-TEST-TOKEN-2026';
  console.log(`   ✅ Admin token active: ${token}`);

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Test 3: GET Admin Catalog
  console.log('\n3️⃣ Fetching admin data catalog via POST /api/admin-data.php...');
  const adminRes = await fetch(`${baseUrl}/api/admin-data.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ action: 'all' })
  });
  const adminData = await adminRes.json();
  if (!adminData.success || !Array.isArray(adminData.galleriesCatalog)) {
    throw new Error(`Failed to retrieve galleriesCatalog from admin endpoint! Response: ${JSON.stringify(adminData)}`);
  }
  console.log(`   ✅ Admin catalog returned ${adminData.galleriesCatalog.length} gallery records.`);

  // Test 4: Admin Add New Gallery Item
  console.log('\n4️⃣ Adding a new gallery item via save_gallery action...');
  const newGalleryPayload = {
    action: 'save_gallery',
    gallery: {
      title: 'Automated E2E Test Gallery Item',
      slug: 'automated-e2e-test-gallery-item',
      category: 'Medical Drives',
      description: 'Created during automated testing suite execution.',
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
      event_date: '2026-09-24',
      location: 'Virar Center, Mumbai',
      sort_order: 99,
      is_published: 1,
      has_details: 1
    }
  };

  const addRes = await fetch(`${baseUrl}/api/admin-data.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(newGalleryPayload)
  });
  const addData = await addRes.json();
  if (!addData.success || (!addData.galleryId && (!addData.item || !addData.item.id))) {
    throw new Error(`save_gallery add failed: ${JSON.stringify(addData)}`);
  }
  const createdId = addData.galleryId || (addData.item && addData.item.id);
  console.log(`   ✅ Successfully created gallery item with ID: ${createdId}`);

  // Test 5: Verify new item in Public API
  const publicAfterAddRes = await fetch(`${baseUrl}/api/gallery`);
  const publicAfterAddJson = await publicAfterAddRes.json();
  const publicAfterAdd = Array.isArray(publicAfterAddJson) ? publicAfterAddJson : (publicAfterAddJson.data || []);
  const createdInPublic = publicAfterAdd.find(i => String(i.id || i.gallery_id) === String(createdId));
  if (!createdInPublic) {
    throw new Error(`Created item ID ${createdId} not found in public GET /api/gallery!`);
  }
  console.log(`   ✅ Created item verified in public API response.`);

  // Test 6: Update Gallery Item
  console.log('\n5️⃣ Updating created gallery item via save_gallery...');
  const updatePayload = {
    action: 'save_gallery',
    gallery: {
      id: createdId,
      gallery_id: createdId,
      title: 'Automated E2E Test Gallery Item (Updated Title)',
      slug: 'automated-e2e-test-gallery-item',
      category: 'Awareness',
      description: 'Updated description for test verification.',
      image: createdInPublic.image || createdInPublic.image_url,
      event_date: '2026-09-25',
      location: 'Updated Location, Mumbai',
      sort_order: 1,
      is_published: 1,
      has_details: 0
    }
  };
  const updateRes = await fetch(`${baseUrl}/api/admin-data.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify(updatePayload)
  });
  const updateData = await updateRes.json();
  if (!updateData.success) {
    throw new Error(`Update failed: ${JSON.stringify(updateData)}`);
  }
  console.log(`   ✅ Successfully updated gallery item ID: ${createdId}`);

  // Test 7: Toggle Published state (Unpublish)
  console.log('\n6️⃣ Unpublishing gallery item via toggle_gallery_published...');
  const toggleRes = await fetch(`${baseUrl}/api/admin-data.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'toggle_gallery_published',
      id: createdId,
      is_published: 0
    })
  });
  const toggleData = await toggleRes.json();
  if (!toggleData.success) {
    throw new Error(`toggle_gallery_published failed: ${JSON.stringify(toggleData)}`);
  }

  // Verify item is NOT in public API when unpublished
  const publicAfterUnpublishRes = await fetch(`${baseUrl}/api/gallery`);
  const publicAfterUnpublishJson = await publicAfterUnpublishRes.json();
  const publicAfterUnpublish = Array.isArray(publicAfterUnpublishJson) ? publicAfterUnpublishJson : (publicAfterUnpublishJson.data || []);
  const foundUnpublished = publicAfterUnpublish.find(i => String(i.id || i.gallery_id) === String(createdId));
  if (foundUnpublished) {
    throw new Error(`Unpublished item ID ${createdId} was still present in public GET /api/gallery!`);
  }
  console.log(`   ✅ Unpublished item is correctly omitted from public GET /api/gallery response.`);

  // Test 8: Delete Gallery Item
  console.log('\n7️⃣ Deleting gallery item via delete_gallery...');
  const deleteRes = await fetch(`${baseUrl}/api/admin-data.php`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      action: 'delete_gallery',
      id: createdId
    })
  });
  const deleteData = await deleteRes.json();
  if (!deleteData.success) {
    throw new Error(`delete_gallery failed: ${JSON.stringify(deleteData)}`);
  }
  console.log(`   ✅ Successfully deleted gallery item ID: ${createdId}`);

  console.log('\n🎉 ALL GALLERY CRUD & PUBLIC API TESTS PASSED SUCCESSFULLY!');
}

runGalleryTests().catch(err => {
  console.error('\n❌ Gallery Test Failed:', err);
  process.exit(1);
});
