// seed-resources.js - Run this once to populate resources with sample articles
// This script adds 3 articles per category: Nutrition, Training, Health, Grooming
// Firebase v8 compat syntax

var sampleResources = [
  // Nutrition articles
  {
    title: 'Essential Nutrients for Dogs',
    category: 'Nutrition',
    content: 'Dogs require a balanced diet containing proteins, fats, carbohydrates, vitamins, and minerals. High-quality protein sources like chicken, beef, and fish should be the foundation of their diet. Avoid foods toxic to dogs such as chocolate, grapes, onions, and xylitol. Always provide fresh water and consult your vet for specific dietary needs based on age, size, and health conditions.',
    imageURL: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  {
    title: 'Cat Nutrition Basics',
    category: 'Nutrition',
    content: 'Cats are obligate carnivores, meaning they require meat to survive. Their diet should be high in protein and moderate in fat. Taurine is an essential amino acid that cats cannot produce themselves, so it must be included in their food. Wet food can help with hydration, while dry food helps with dental health. A combination of both is often recommended.',
    imageURL: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  {
    title: 'Feeding Schedule Tips',
    category: 'Nutrition',
    content: 'Establishing a consistent feeding schedule helps with digestion and prevents overeating. Puppies typically need 3-4 meals per day, while adult dogs do well with 2 meals. Cats prefer smaller, more frequent meals. Avoid free-feeding if your pet tends to overeat. Measure portions carefully and adjust based on your pet\'s activity level and body condition.',
    imageURL: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  // Training articles
  {
    title: 'Basic Commands Every Dog Should Know',
    category: 'Training',
    content: 'Start with sit, stay, come, and down. These commands form the foundation of good behavior and safety. Use positive reinforcement with treats and praise. Keep training sessions short (5-10 minutes) and fun. Be consistent with commands and rewards. Practice in different environments to generalize the behavior. Never punish your dog during training - this creates fear and confusion.',
    imageURL: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  {
    title: 'Litter Training Your Kitten',
    category: 'Training',
    content: 'Start litter training as soon as you bring your kitten home. Place the litter box in a quiet, accessible location. Show the kitten the box and gently place them in it after meals. Keep the box clean - cats are fastidious and may avoid dirty boxes. Use unscented litter initially as strong scents can deter some cats. Have one more litter box than the number of cats in your household.',
    imageURL: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  {
    title: 'Crate Training Benefits',
    category: 'Training',
    content: 'Crate training provides a safe space for your dog and aids in house training. Introduce the crate gradually with positive associations - feed meals inside, leave treats and toys. Never use the crate as punishment. The crate should be large enough for your dog to stand, turn around, and lie down comfortably. Limit crate time for puppies and ensure plenty of exercise and socialization outside the crate.',
    imageURL: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  // Health articles
  {
    title: 'Vaccination Schedule for Puppies',
    category: 'Health',
    content: 'Puppies typically receive their first vaccinations at 6-8 weeks of age. Core vaccines include distemper, parvovirus, and rabies. Booster shots are given every 3-4 weeks until 16-20 weeks of age. After the initial series, boosters are typically given annually or every three years depending on the vaccine. Keep a record of all vaccinations and consult your vet for the best schedule for your puppy.',
    imageURL: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  {
    title: 'Common Cat Health Issues',
    category: 'Health',
    content: 'Common health problems in cats include dental disease, obesity, urinary tract issues, and parasites. Regular vet check-ups can catch these issues early. Watch for changes in appetite, litter box habits, or behavior. Dental chews and regular brushing can help prevent dental disease. Keep your cat at a healthy weight through proper diet and exercise. Use flea and tick prevention year-round.',
    imageURL: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  {
    title: 'Signs Your Pet Needs Emergency Care',
    category: 'Health',
    content: 'Seek immediate veterinary care if your pet experiences difficulty breathing, severe bleeding, seizures, inability to urinate or defecate, sudden inability to stand, extreme lethargy, pale gums, or abdominal distension. Other emergency signs include trauma, poisoning, heatstroke, or ingestion of foreign objects. Keep your vet\'s emergency number and the nearest 24-hour animal hospital contact information readily available.',
    imageURL: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  // Grooming articles
  {
    title: 'Brushing Your Dog\'s Coat',
    category: 'Grooming',
    content: 'Regular brushing removes loose hair, prevents matting, and distributes natural oils. Long-haired dogs need daily brushing, while short-haired breeds may only need weekly sessions. Use the right tools for your dog\'s coat type - slicker brushes for removing loose hair, combs for detangling, and bristle brushes for smoothing. Start brushing gradually and make it a positive experience with treats and praise.',
    imageURL: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  {
    title: 'Cat Grooming Essentials',
    category: 'Grooming',
    content: 'While cats are self-groomers, they benefit from regular brushing to reduce hairballs and matting. Long-haired cats need daily brushing, while short-haired cats need weekly sessions. Introduce grooming slowly and use gentle strokes. Trim nails every 2-3 weeks using cat-specific clippers. Check ears weekly for dirt or signs of infection. Regular dental care with cat-safe toothpaste helps prevent dental disease.',
    imageURL: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  },
  {
    title: 'Bathing Your Pet Safely',
    category: 'Grooming',
    content: 'Most dogs need bathing every 1-3 months, depending on their lifestyle and coat. Use lukewarm water and pet-specific shampoo. Avoid getting water in ears and eyes. Cats typically don\'t need regular baths unless they get into something messy or have skin conditions. Always brush before bathing to remove loose hair and prevent matting. Rinse thoroughly and dry completely, especially in cold weather.',
    imageURL: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400&h=200&fit=crop',
    author: 'PawPath Team'
  }
];

async function seedResources() {
  console.log('Starting to seed resources...');
  
  for (var i = 0; i < sampleResources.length; i++) {
    var resource = sampleResources[i];
    try {
      await db.collection('resources').add({
        title: resource.title,
        category: resource.category,
        content: resource.content,
        imageURL: resource.imageURL,
        author: resource.author,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log('Added:', resource.title);
    } catch (err) {
      console.error('Error adding', resource.title, ':', err);
    }
  }
  
  console.log('Seeding complete!');
  alert('Resources have been seeded successfully!');
}

// Auto-run when script loads (remove this line if you want to trigger manually)
document.addEventListener('DOMContentLoaded', function() {
  // Check if we're on admin page
  if (document.getElementById('adminContent')) {
    var seedBtn = document.createElement('button');
    seedBtn.className = 'btn btn-secondary';
    seedBtn.textContent = 'Seed Sample Resources';
    seedBtn.style.marginTop = '10px';
    seedBtn.onclick = seedResources;
    
    var toolbar = document.querySelector('#panel-resources .panel-toolbar');
    if (toolbar) {
      toolbar.appendChild(seedBtn);
    }
  }
});
