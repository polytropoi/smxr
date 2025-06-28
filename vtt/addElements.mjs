import { Assets, AnimatedSprite, Container, Sprite, Texture, Spritesheet } from 'pixi';

export function addFishes(app, fishes) {
  // Create a container to hold all the fish sprites.
  const fishContainer = new Container();

  // Add the fish container to the stage.
  app.stage.addChild(fishContainer);

  const fishCount = 20;
  const fishAssets = ['fish1', 'fish2', 'fish3', 'fish4', 'fish5'];

  // Create a fish sprite for each fish.
  for (let i = 0; i < fishCount; i++) {
    // Cycle through the fish assets for each sprite.
    const fishAsset = fishAssets[i % fishAssets.length];

    // Create a fish sprite.
    const fish = Sprite.from(fishAsset);

    // Center the sprite anchor.
    fish.anchor.set(0.5);

    // Assign additional properties for the animation.
    fish.direction = Math.random() * Math.PI * 2;
    fish.speed = 2 + Math.random() * 2;
    fish.turnSpeed = Math.random() - 0.8;

    // Randomly position the fish sprite around the stage.
    fish.x = Math.random() * app.screen.width;
    fish.y = Math.random() * app.screen.height;

    // Randomly scale the fish sprite to create some variety.
    fish.scale.set(0.5 + Math.random() * 0.2);

    // Add the fish sprite to the fish container.
    fishContainer.addChild(fish);

    // Add the fish sprite to the fish array.
    fishes.push(fish);
  }
}

export function animateFishes(app, fishes, time) {
  // Extract the delta time from the Ticker object.
  const delta = time.deltaTime;

  // Define the padding around the stage where fishes are considered out of sight.
  const stagePadding = 100;
  const boundWidth = app.screen.width + stagePadding * 2;
  const boundHeight = app.screen.height + stagePadding * 2;

  // Iterate through each fish sprite.
  fishes.forEach((fish) => {
    // Animate the fish movement direction according to the turn speed.
    fish.direction += fish.turnSpeed * 0.01;

    // Animate the fish position according to the direction and speed.
    fish.x += Math.sin(fish.direction) * fish.speed;
    fish.y += Math.cos(fish.direction) * fish.speed;

    // Apply the fish rotation according to the direction.
    fish.rotation = -fish.direction - Math.PI / 2;

    // Wrap the fish position when it goes out of bounds.
    if (fish.x < -stagePadding) {
      fish.x += boundWidth;
    }
    if (fish.x > app.screen.width + stagePadding) {
      fish.x -= boundWidth;
    }
    if (fish.y < -stagePadding) {
      fish.y += boundHeight;
    }
    if (fish.y > app.screen.height + stagePadding) {
      fish.y -= boundHeight;
    }
  });
}

export async function addSpriteAnimation (app, texture, spriteData) {

// const sprite = 'sprites1';
    // let asset = sprites.
    console.log("spritesData " + JSON.stringify(spriteData));

    const sheet = new Spritesheet(texture, spriteData);
    await sheet.parse();
    console.log('Spritesheet ready to use!');
        //     await Assets.load(spriteData);
                    const frames = [];
        var count = 0;
        for(var key in spriteData.frames) {
        if(spriteData.frames.hasOwnProperty(key)) {
            console.log(key);
            // frames.push(Texture.from(key));
                        frames.push(sheet.textures[key]);
                count++;
            }
        }

        // let length = spriteData.frames.length;
        console.log("frames " + count);
        

        // Create an array of textures from the sprite sheet


        // for (let i = 0; i < count + 1; i++) {
        //     const val = i < count + 1 ? `0${i}` : i;

        //     // Magically works since the spritesheet was loaded with the pixi loader
        //     frames.push(Texture.from(`0${val}.webp`));
        // }
        // Load the animation sprite sheet
//   await Assets.load('https://pixijs.com/assets/spritesheet/fighter.json');

//   // Create an array of textures from the sprite sheet
//   const frames = [];

//   for (let i = 0; i < 30; i++) {
//     const val = i < 10 ? `0${i}` : i;

//     // Magically works since the spritesheet was loaded with the pixi loader
//     frames.push(Texture.from(`rollSequence00${val}.png`));
//   }

  // Create an AnimatedSprite (brings back memories from the days of Flash, right ?)
  const anim = new AnimatedSprite(frames);

  /*
   * An AnimatedSprite inherits all the properties of a PIXI sprite
   * so you can change its position, its anchor, mask it, etc
   */
  anim.x = app.screen.width / 2;
  anim.y = app.screen.height / 2;
  anim.anchor.set(0.5);
  anim.animationSpeed = 1;
  anim.width = 256;
  anim.height = 256;
  anim.play();

  app.stage.addChild(anim);


}

