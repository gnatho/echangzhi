# Spelling Activity Media Integration Plan

## Overview
This plan details the integration of pictures and audio into the Spelling part of Grammar Mode. The goal is to rename existing media files to a simple naming convention (e.g., `cat.mp3` and `cat.jpg`) and update the code to use these files.

## Implementation Steps

1. **Run the PowerShell script** to rename all audio and image files
2. **Update script.js** to add helper function and modify spelling UI
3. **Update styles.css** to add image display styles
4. **Test** the spelling activity with pictures and audio

## Current State Analysis

### Word Data Structure
- **7 books** (levels 0-6) in `levelUnits`
- **10 units** per book (units 0-9)
- Words are stored as arrays of strings
- Multi-word phrases exist (e.g., "play soccer", "bus stop", "T-shirt")

### Current File Naming Convention

#### Audio Files
- Pattern: `SM{book}_U{unit}_A{activity}_{word}_1.mp3`
- Example: `SM1_U3_A4_cat_1.mp3`
- Location: `static/audio/`

#### Image Files
- Pattern: `SM{book}_U{unit}_W{wordNum}_{word}_1.jpg`
- Example: `SM1_U3_W4_cat_1.jpg`
- Location: `static/imgs/words/`

### Target Naming Convention
- Audio: `{word}.mp3` (e.g., `cat.mp3`)
- Image: `{word}.jpg` (e.g., `cat.jpg`)
- Spaces replaced with underscores: `bus_stop.mp3`
- Hyphens preserved: `go-kart.jpg`
- Case: lowercase

---

## File Renaming Mapping

### Level 0 (Book 0) Words

| Word | Current Audio | Current Image | New Name |
|------|---------------|---------------|----------|
| blue | - | SM0_U0_W1_blue_1.jpg | blue.jpg |
| green | - | SM0_U0_W2_green_1.jpg | green.jpg |
| yellow | - | SM0_U0_W3_yellow_1.jpg | yellow.jpg |
| orange | - | SM0_U0_W4_orange_1.jpg | orange.jpg |
| red | - | SM0_U0_W5_red_1.jpg | red.jpg |
| pink | - | SM0_U0_W6_pink_1.jpg | pink.jpg |
| one | - | SM0_U0_W7_one_1.jpg | one.jpg |
| two | - | SM0_U0_W8_two_1.jpg | two.jpg |
| three | - | SM0_U0_W9_three_1.jpg | three.jpg |
| four | - | SM0_U0_W10_four_1.jpg | four.jpg |
| five | - | SM0_U0_W11_five_1.jpg | five.jpg |
| six | - | SM0_U0_W12_six_1.jpg | six.jpg |
| seven | - | SM0_U0_W13_seven_1.jpg | seven.jpg |
| eight | - | SM0_U0_W14_eight_1.jpg | eight.jpg |
| nine | - | SM0_U0_W15_nine_1.jpg | nine.jpg |
| ten | - | SM0_U0_W16_ten_1.jpg | ten.jpg |
| window | - | SM0_U1_W1_window_1.jpg | window.jpg |
| door | - | SM0_U1_W2_door_1.jpg | door.jpg |
| chair | - | SM0_U1_W3_chair_1.jpg | chair.jpg |
| pencil | - | SM0_U1_W4_pencil_1.jpg | pencil.jpg |
| book | - | SM0_U1_W5_book_1.jpg | book.jpg |
| table | - | SM0_U1_W6_table_1.jpg | table.jpg |
| eyes | - | SM0_U2_W1_eyes_1.jpg | eyes.jpg |
| ears | - | SM0_U2_W2_ears_1.jpg | ears.jpg |
| arms | - | SM0_U2_W3_arms_1.jpg | arms.jpg |
| legs | - | SM0_U2_W4_legs_1.jpg | legs.jpg |
| mouth | - | SM0_U2_W5_mouth_1.jpg | mouth.jpg |
| nose | - | SM0_U2_W6_nose_1.jpg | nose.jpg |
| head | - | SM0_U2_W7_head_1.jpg | head.jpg |
| mom | - | SM0_U3_W1_mom_1.jpg | mom.jpg |
| dad | - | SM0_U3_W2_dad_1.jpg | dad.jpg |
| sister | - | SM0_U3_W3_sister_1.jpg | sister.jpg |
| brother | - | SM0_U3_W4_brother_1.jpg | brother.jpg |
| grandpa | - | SM0_U3_W5_grandpa_1.jpg | grandpa.jpg |
| grandma | - | SM0_U3_W6_grandma_1.jpg | grandma.jpg |
| fish | SM1_U4_A7_fish_1.mp3 | SM0_U4_W1_fish_1.jpg | fish.jpg/mp3 |
| parrot | SM2_U2_A7_parrot_1.mp3 | SM0_U4_W2_parrot_1.jpg | parrot.jpg/mp3 |
| zebra | SM2_U2_A3_zebra_1.mp3 | SM0_U4_W3_zebra_1.jpg | zebra.jpg/mp3 |
| lion | - | SM0_U4_W4_lion_1.jpg | lion.jpg |
| big | - | SM0_U4_W5_big_1.jpg | big.jpg |
| small | - | SM0_U4_W6_small_1.jpg | small.jpg |
| milk | - | SM0_U5_W1_milk_1.jpg | milk.jpg |
| cupcakes | - | SM0_U5_W2_cupcakes_1.jpg | cupcakes.jpg |
| oranges | - | SM0_U5_W3_oranges_1.jpg | oranges.jpg |
| tomatoes | SM2_U4_A1_tomatoes_1.mp3 | SM0_U5_W4_tomatoes_1.jpg | tomatoes.jpg/mp3 |
| chocolate | - | SM0_U5_W5_chocolate_1.jpg | chocolate.jpg |
| pears | - | SM0_U5_W6_pears_1.jpg | pears.jpg |
| bus stop | SM2_U3_A8_bus_stop_1.mp3 | SM0_U6_W1_bus_stop_1.jpg | bus_stop.jpg/mp3 |
| school | SM2_U3_A10_school_1.mp3 | SM0_U6_W2_school_1.jpg | school.jpg/mp3 |
| movie theater | SM2_U3_A3_movie_theater_1.mp3 | SM0_U6_W3_movie_theater_1.jpg | movie_theater.jpg/mp3 |
| hospital | SM2_U3_A2_hospital_1.mp3 | SM0_U6_W4_hospital_1.jpg | hospital.jpg/mp3 |
| toy store | - | SM0_U6_W5_toy_store_1.jpg | toy_store.jpg |
| park | SM2_U3_A9_park_1.mp3 | SM0_U6_W6_park_1.jpg | park.jpg/mp3 |
| teacher | - | SM0_U7_W1_teacher_1.jpg | teacher.jpg |
| firefighter | - | SM0_U7_W2_firefighter_1.jpg | firefighter.jpg |
| gardener | - | SM0_U7_W3_gardener_1.jpg | gardener.jpg |
| police officer | - | SM0_U7_W4_police_officer_1.jpg | police_officer.jpg |
| vet | - | SM0_U7_W5_vet_1.jpg | vet.jpg |
| doctor | - | SM0_U7_W6_doctor_1.jpg | doctor.jpg |
| hat | - | SM0_U8_W1_hat_1.jpg | hat.jpg |
| coat | - | SM0_U8_W2_coat_1.jpg | coat.jpg |
| sweater | SM1_U7_A1_sweater_1.mp3 | SM0_U8_W3_sweater_1.jpg | sweater.jpg/mp3 |
| scarf | - | SM0_U8_W4_scarf_1.jpg | scarf.jpg |
| gloves | - | SM0_U8_W5_gloves_1.jpg | gloves.jpg |
| jeans | SM1_U7_A7_jeans_1.mp3 | SM0_U8_W6_jeans_1.jpg | jeans.jpg/mp3 |
| T-shirt | SM1_U7_A10_t_shirt_1.mp3 | SM0_U8_W7_t_shirt_1.jpg | t_shirt.jpg/mp3 |
| boots | - | SM0_U8_W8_boots_1.jpg | boots.jpg |
| play soccer | - | SM0_U9_W1_play_soccer_1.jpg | play_soccer.jpg |
| run | - | SM0_U9_W2_run_1.jpg | run.jpg |
| paint a picture | SM1_U9_A1_paint_a_picture_1.mp3 | SM0_U9_W3_paint_a_picture_1.jpg | paint_a_picture.jpg/mp3 |
| swim | SM2_U8_A7_swimming_1.mp3 | SM0_U9_W4_swim_1.jpg | swim.jpg/mp3 |
| read | - | SM0_U9_W5_read_1.jpg | read.jpg |
| dance | - | SM0_U9_W6_dance_1.jpg | dance.jpg |

### Level 1 (Book 1) Words

| Word | Current Audio | Current Image | New Name |
|------|---------------|---------------|----------|
| Whisper | SM1_U0_A1_Whisper_1.mp3 | SM1_U0_W1_whisper_1.jpg | whisper.jpg/mp3 |
| Thunder | SM1_U0_A2_Thunder_1.mp3 | SM1_U0_W2_Thunder_1.jpg | thunder.jpg/mp3 |
| Misty | SM1_U0_A3_Misty_1.mp3 | SM1_U0_W3_Misty_1.jpg | misty.jpg/mp3 |
| Flash | SM1_U0_A4_Flash_1.mp3 | SM1_U0_W4_Flash_1.jpg | flash.jpg/mp3 |
| ruler | SM1_U1_A1_ruler_1.mp3 | SM1_U1_W1_ruler_1.jpg | ruler.jpg/mp3 |
| pen | SM1_U1_A2_pen_1.mp3 | SM1_U1_W2_pen_1.jpg | pen.jpg/mp3 |
| book | SM1_U1_A3_book_1.mp3 | SM1_U1_W3_book_1.jpg | book.jpg/mp3 |
| eraser | SM1_U1_A4_eraser_1.mp3 | SM1_U1_W4_eraser_1.jpg | eraser.jpg/mp3 |
| pencil case | SM1_U1_A5_pencil_case_1.mp3 | SM1_U1_W5_pencil_case_1.jpg | pencil_case.jpg/mp3 |
| pencil | SM1_U1_A6_pencil_1.mp3 | SM1_U1_W6_pencil_1.jpg | pencil.jpg/mp3 |
| desk | SM1_U1_A7_desk_1.mp3 | SM1_U1_W7_desk_1.jpg | desk.jpg/mp3 |
| notebook | SM1_U1_A8_notebook_1.mp3 | SM1_U1_W8_notebook_1.jpg | notebook.jpg/mp3 |
| bag | SM1_U1_A9_bag_1.mp3 | SM1_U1_W9_bag_1.jpg | bag.jpg/mp3 |
| paper | SM1_U1_A10_paper_1.mp3 | SM1_U1_W10_paper_1.jpg | paper.jpg/mp3 |
| computer game | SM1_U2_A1_computer_game_1.mp3 | SM1_U2_W1_computer_game_1.jpg | computer_game.jpg/mp3 |
| kite | SM1_U2_A2_kite_1.mp3 | SM1_U2_W2_kite_1.jpg | kite.jpg/mp3 |
| plane | SM1_U2_A3_plane_1.mp3 | SM1_U2_W3_plane_1.jpg | plane.jpg/mp3 |
| bike | SM1_U2_A4_bike_1.mp3 | SM1_U2_W4_bike_1.jpg | bike.jpg/mp3 |
| doll | SM1_U2_A5_doll_1.mp3 | SM1_U2_W5_doll_1.jpg | doll.jpg/mp3 |
| monster | SM1_U2_A6_monster_1.mp3 | SM1_U2_W6_monster_1.jpg | monster.jpg/mp3 |
| train | SM1_U2_A7_train_1.mp3 | SM1_U2_W7_train_1.jpg | train.jpg/mp3 |
| go-kart | SM1_U2_A8_go_kart_1.mp3 | SM1_U2_W8_go_kart_1.jpg | go-kart.jpg/mp3 |
| car | SM1_U2_A9_car_1.mp3 | SM1_U2_W9_car_1.jpg | car.jpg/mp3 |
| ball | SM1_U2_A10_ball_1.mp3 | SM1_U2_W10_ball_1.jpg | ball.jpg/mp3 |
| donkey | SM1_U3_A1_donkey_1.mp3 | SM1_U3_W1_donkey_1.jpg | donkey.jpg/mp3 |
| elephant | SM1_U3_A2_elephant_1.mp3 | SM1_U3_W2_elephant_1.jpg | elephant.jpg/mp3 |
| spider | SM1_U3_A3_spider_1.mp3 | SM1_U3_W3_spider_1.jpg | spider.jpg/mp3 |
| cat | SM1_U3_A4_cat_1.mp3 | SM1_U3_W4_cat_1.jpg | cat.jpg/mp3 |
| rat | SM1_U3_A5_rat_1.mp3 | SM1_U3_W5_rat_1.jpg | rat.jpg/mp3 |
| frog | SM1_U3_A6_frog_1.mp3 | SM1_U3_W6_frog_1.jpg | frog.jpg/mp3 |
| duck | SM1_U3_A7_duck_1.mp3 | SM1_U3_W7_duck_1.jpg | duck.jpg/mp3 |
| lizard | SM1_U3_A8_lizard_1.mp3 | SM1_U3_W8_lizard_1.jpg | lizard.jpg/mp3 |
| dog | SM1_U3_A9_dog_1.mp3 | SM1_U3_W9_dog_1.jpg | dog.jpg/mp3 |
| apple | SM1_U4_A1_apple_1.mp3 | SM1_U4_W1_apple_1.jpg | apple.jpg/mp3 |
| banana | SM1_U4_A2_banana_1.mp3 | SM1_U4_W2_banana_1.jpg | banana.jpg/mp3 |
| cake | SM1_U4_A3_cake_1.mp3 | SM1_U4_W3_cake_1.jpg | cake.jpg/mp3 |
| pizza | SM1_U4_A4_pizza_1.mp3 | SM1_U4_W4_pizza_1.jpg | pizza.jpg/mp3 |
| sausage | SM1_U4_A5_sausage_1.mp3 | SM1_U4_W5_sausage_1.jpg | sausage.jpg/mp3 |
| cheese sandwich | SM1_U4_A6_cheese_sandwich_1.mp3 | SM1_U4_W6_cheese_sandwich_1.jpg | cheese_sandwich.jpg/mp3 |
| fish | SM1_U4_A7_fish_1.mp3 | SM1_U4_W7_fish_1.jpg | fish.jpg/mp3 |
| chicken | SM1_U4_A8_chicken_1.mp3 | SM1_U4_W8_chicken_1.jpg | chicken.jpg/mp3 |
| peas | SM1_U4_A9_peas_1.mp3 | SM1_U4_W9_peas_1.jpg | peas.jpg/mp3 |
| steak | SM1_U4_A10_steak_1.mp3 | SM1_U4_W10_steak_1.jpg | steak.jpg/mp3 |
| carrots | SM1_U4_A11_carrots_1.mp3 | SM1_U4_W11_carrots_1.jpg | carrots.jpg/mp3 |
| Monday | SM1_U5_A1_Monday_1.mp3 | SM1_U5_W1_Monday_1.jpg | monday.jpg/mp3 |
| Tuesday | SM1_U5_A2_Tuesday_1.mp3 | SM1_U5_W2_Tuesday_1.jpg | tuesday.jpg/mp3 |
| Wednesday | SM1_U5_A3_Wednesday_1.mp3 | SM1_U5_W3_Wednesday_1.jpg | wednesday.jpg/mp3 |
| Thursday | SM1_U5_A4_Thursday_1.mp3 | SM1_U5_W4_Thursday_1.jpg | thursday.jpg/mp3 |
| Friday | SM1_U5_A5_Friday_1.mp3 | SM1_U5_W5_Friday_1.jpg | friday.jpg/mp3 |
| Saturday | SM1_U5_A6_Saturday_1.mp3 | SM1_U5_W6_Saturday_1.jpg | saturday.jpg/mp3 |
| Sunday | SM1_U5_A7_Sunday_1.mp3 | SM1_U5_W7_Sunday_1.jpg | sunday.jpg/mp3 |
| bedroom | SM1_U6_A1_bedroom_1.mp3 | SM1_U6_W1_bedroom_1.jpg | bedroom.jpg/mp3 |
| bathroom | SM1_U6_A2_bathroom_1.mp3 | SM1_U6_W2_bathroom_1.jpg | bathroom.jpg/mp3 |
| living room | SM1_U6_A3_living_room_1.mp3 | SM1_U6_W3_living_room_1.jpg | living_room.jpg/mp3 |
| kitchen | SM1_U6_A4_kitchen_1.mp3 | SM1_U6_W4_kitchen_1.jpg | kitchen.jpg/mp3 |
| hall | SM1_U6_A5_hall_1.mp3 | SM1_U6_W5_hall_1.jpg | hall.jpg/mp3 |
| stairs | SM1_U6_A6_stairs_1.mp3 | SM1_U6_W6_stairs_1.jpg | stairs.jpg/mp3 |
| basement | SM1_U6_A7_basement_1.mp3 | SM1_U6_W7_basement_1.jpg | basement.jpg/mp3 |
| dining room | SM1_U6_A8_dining_room_1.mp3 | SM1_U6_W8_dining_room_1.jpg | dining_room.jpg/mp3 |
| sweater | SM1_U7_A1_sweater_1.mp3 | SM1_U7_W1_sweater_1.jpg | sweater.jpg/mp3 |
| skirt | SM1_U7_A2_skirt_1.mp3 | SM1_U7_W2_skirt_1.jpg | skirt.jpg/mp3 |
| shorts | SM1_U7_A3_shorts_1.mp3 | SM1_U7_W3_shorts_1.jpg | shorts.jpg/mp3 |
| pants | SM1_U7_A4_pants_1.mp3 | SM1_U7_W4_pants_1.jpg | pants.jpg/mp3 |
| jacket | SM1_U7_A5_jacket_1.mp3 | SM1_U7_W5_jacket_1.jpg | jacket.jpg/mp3 |
| socks | SM1_U7_A6_socks_1.mp3 | SM1_U7_W6_socks_1.jpg | socks.jpg/mp3 |
| jeans | SM1_U7_A7_jeans_1.mp3 | SM1_U7_W7_jeans_1.jpg | jeans.jpg/mp3 |
| shoes | SM1_U7_A8_shoes_1.mp3 | SM1_U7_W8_shoes_1.jpg | shoes.jpg/mp3 |
| baseball cap | SM1_U7_A9_baseball_cap_1.mp3 | SM1_U7_W9_baseball_cap_1.jpg | baseball_cap.jpg/mp3 |
| T-shirt | SM1_U7_A10_t_shirt_1.mp3 | SM1_U7_W10_t_shirt_1.jpg | t_shirt.jpg/mp3 |
| arm | SM1_U8_A1_arm_1.mp3 | SM1_U8_W1_arm_1.jpg | arm.jpg/mp3 |
| hand | SM1_U8_A2_hand_1.mp3 | SM1_U8_W2_hand_1.jpg | hand.jpg/mp3 |
| knee | SM1_U8_A3_knee_1.mp3 | SM1_U8_W3_knee_1.jpg | knee.jpg/mp3 |
| fingers | SM1_U8_A4_fingers_1.mp3 | SM1_U8_W4_fingers_1.jpg | fingers.jpg/mp3 |
| leg | SM1_U8_A5_leg_1.mp3 | SM1_U8_W5_leg_1.jpg | leg.jpg/mp3 |
| foot | SM1_U8_A6_foot_1.mp3 | SM1_U8_W6_foot_1.jpg | foot.jpg/mp3 |
| toes | SM1_U8_A7_toes_1.mp3 | SM1_U8_W7_toes_1.jpg | toes.jpg/mp3 |
| head | SM1_U8_A8_head_1.mp3 | SM1_U8_W8_head_1.jpg | head.jpg/mp3 |
| paint a picture | SM1_U9_A1_paint_a_picture_1.mp3 | SM1_U9_W1_paint_a_picture_1.jpg | paint_a_picture.jpg/mp3 |
| listen to music | SM1_U9_A2_listen_to_music_1.mp3 | SM1_U9_W2_listen_to_music_1.jpg | listen_to_music.jpg/mp3 |
| catch a fish | SM1_U9_A3_catch_a_fish_1.mp3 | SM1_U9_W3_catch_a_fish_1.jpg | catch_a_fish.jpg/mp3 |
| take a photo | SM1_U9_A4_take_a_photo_1.mp3 | SM1_U9_W4_take_a_photo_1.jpg | take_a_photo.jpg/mp3 |
| eat ice cream | SM1_U9_A5_eat_ice_cream_1.mp3 | SM1_U9_W5_eat_ice_cream_1.jpg | eat_ice_cream.jpg/mp3 |
| play the guitar | SM1_U9_A6_play_the_guitar_1.mp3 | SM1_U9_W6_play_the_guitar_1.jpg | play_the_guitar.jpg/mp3 |
| read a book | SM1_U9_A7_read_a_book_1.mp3 | SM1_U9_W7_read_a_book_1.jpg | read_a_book.jpg/mp3 |
| make a sandcastle | SM1_U9_A8_make_a_sandcastle_1.mp3 | SM1_U9_W8_make_a_sandcastle_1.jpg | make_a_sandcastle.jpg/mp3 |
| look for shells | SM1_U9_A9_look_for_shells_1.mp3 | SM1_U9_W9_look_for_shells_1.jpg | look_for_shells.jpg/mp3 |

### Level 2 (Book 2) Words

| Word | Current Audio | Current Image | New Name |
|------|---------------|---------------|----------|
| bookcase | SM2_U0_A1_bookcase_1.mp3 | SM2_U0_W1_bookcase_1.jpg | bookcase.jpg/mp3 |
| wall | SM2_U0_A2_wall_1.mp3 | SM2_U0_W2_wall_1.jpg | wall.jpg/mp3 |
| board | SM2_U0_A3_board_1.mp3 | SM2_U0_W3_board_1.jpg | board.jpg/mp3 |
| clock | SM2_U0_A4_clock_1.mp3 | SM2_U0_W4_clock_1.jpg | clock.jpg/mp3 |
| door | SM2_U0_A5_door_1.mp3 | SM2_U0_W5_door_1.jpg | door.jpg/mp3 |
| cabinet | SM2_U0_A6_cabinet_1.mp3 | SM2_U0_W6_cabinet_1.jpg | cabinet.jpg/mp3 |
| window | SM2_U0_A7_window_1.mp3 | SM2_U0_W7_window_1.jpg | window.jpg/mp3 |
| chair | SM2_U0_A8_chair_1.mp3 | SM2_U0_W8_chair_1.jpg | chair.jpg/mp3 |
| crayon | SM2_U0_A9_crayon_1.mp3 | SM2_U0_W9_crayon_1.jpg | crayon.jpg/mp3 |
| floor | SM2_U0_A10_floor_1.mp3 | SM2_U0_W10_floor_1.jpg | floor.jpg/mp3 |
| get up | SM2_U1_A1_get_up_1.mp3 | SM2_U1_W1_get_up_1.jpg | get_up.jpg/mp3 |
| get dressed | SM2_U1_A2_get_dressed_1.mp3 | SM2_U1_W2_get_dressed_1.jpg | get_dressed.jpg/mp3 |
| have breakfast | SM2_U1_A3_have_breakfast_1.mp3 | SM2_U1_W3_have_breakfast_1.jpg | have_breakfast.jpg/mp3 |
| brush your teeth | SM2_U1_A4_brush_your_teeth_1.mp3 | SM2_U1_W4_brush_your_teeth_1.jpg | brush_your_teeth.jpg/mp3 |
| go to school | SM2_U1_A5_go_to_school_1.mp3 | - | go_to_school.mp3 |
| have lunch | SM2_U1_A6_have_lunch_1.mp3 | - | have_lunch.mp3 |
| play in the park | SM2_U1_A7_play_in_the_park_1.mp3 | - | play_in_the_park.mp3 |
| have dinner | SM2_U1_A8_have_dinner_1.mp3 | - | have_dinner.mp3 |
| go to bed | SM2_U1_A9_go_to_bed_1.mp3 | - | go_to_bed.mp3 |
| polar bear | SM2_U2_A1_polar_bear_1.mp3 | - | polar_bear.mp3 |
| bear | SM2_U2_A2_bear_1.mp3 | - | bear.mp3 |
| zebra | SM2_U2_A3_zebra_1.mp3 | - | zebra.mp3 |
| crocodile | SM2_U2_A4_crocodile_1.mp3 | - | crocodile.mp3 |
| hippo | SM2_U2_A5_hippo_1.mp3 | - | hippo.mp3 |
| tiger | SM2_U2_A6_tiger_1.mp3 | - | tiger.mp3 |
| parrot | SM2_U2_A7_parrot_1.mp3 | - | parrot.mp3 |
| monkey | SM2_U2_A8_monkey_1.mp3 | - | monkey.mp3 |
| snake | SM2_U2_A9_snake_1.mp3 | - | snake.mp3 |
| train station | SM2_U3_A1_train_station_1.mp3 | SM2_U3_W1_train_station_1.jpg | train_station.jpg/mp3 |
| hospital | SM2_U3_A2_hospital_1.mp3 | SM2_U3_W2_hospital_1.jpg | hospital.jpg/mp3 |
| movie theater | SM2_U3_A3_movie_theater_1.mp3 | SM2_U3_W3_movie_theater_1.jpg | movie_theater.jpg/mp3 |
| playground | SM2_U3_A4_playground_1.mp3 | SM2_U3_W4_playground_1.jpg | playground.jpg/mp3 |
| cafe | SM2_U3_A5_cafe_1.mp3 | SM2_U3_W5_cafe_1.jpg | cafe.jpg/mp3 |
| store | SM2_U3_A6_store_1.mp3 | SM2_U3_W6_store_1.jpg | store.jpg/mp3 |
| street | SM2_U3_A7_street_1.mp3 | SM2_U3_W7_street_1.jpg | street.jpg/mp3 |
| bus stop | SM2_U3_A8_bus_stop_1.mp3 | SM2_U3_W8_bus_stop_1.jpg | bus_stop.jpg/mp3 |
| park | SM2_U3_A9_park_1.mp3 | SM2_U3_W9_park_1.jpg | park.jpg/mp3 |
| school | SM2_U3_A10_school_1.mp3 | - | school.mp3 |
| swimming pool | SM2_U3_A11_swimming_pool_1.mp3 | - | swimming_pool.mp3 |
| tomatoes | SM2_U4_A1_tomatoes_1.mp3 | SM2_U4_W1_tomatoes_1.jpg | tomatoes.jpg/mp3 |
| beans | SM2_U4_A2_beans_1.mp3 | - | beans.mp3 |
| greens | SM2_U4_A3_greens_1.mp3 | - | greens.mp3 |
| potatoes | SM2_U4_A4_potatoes_1.mp3 | - | potatoes.mp3 |
| kiwis | SM2_U4_A5_kiwis_1.mp3 | - | kiwis.mp3 |
| lemons | SM2_U4_A6_lemons_1.mp3 | - | lemons.mp3 |
| bread | SM2_U4_A7_bread_1.mp3 | - | bread.mp3 |
| mangoes | SM2_U4_A8_mangoes_1.mp3 | - | mangoes.mp3 |
| grapes | SM2_U4_A9_grapes_1.mp3 | - | grapes.mp3 |
| eggs | SM2_U4_A10_eggs_1.mp3 | SM2_U4_W10_eggs_1.jpg | eggs.jpg/mp3 |
| watermelons | SM2_U4_A11_watermelons_1.mp3 | SM2_U4_W11_watermelons_1.jpg | watermelons.jpg/mp3 |
| poster | SM2_U5_A1_poster_1.mp3 | - | poster.mp3 |
| closet | SM2_U5_A2_closet_1.mp3 | - | closet.mp3 |
| mirror | SM2_U5_A3_mirror_1.mp3 | - | mirror.mp3 |
| armchair | SM2_U5_A4_armchair_1.mp3 | - | armchair.mp3 |
| lamp | SM2_U5_A5_lamp_1.mp3 | - | lamp.mp3 |
| bed | SM2_U5_A6_bed_1.mp3 | - | bed.mp3 |
| table | SM2_U5_A7_table_1.mp3 | - | table.mp3 |
| couch | SM2_U5_A8_couch_1.mp3 | - | couch.mp3 |
| rug | SM2_U5_A9_rug_1.mp3 | - | rug.mp3 |
| eyes | SM2_U6_A1_eyes_1.mp3 | - | eyes.mp3 |
| face | SM2_U6_A2_face_1.mp3 | - | face.mp3 |
| glasses | SM2_U6_A3_glasses_1.mp3 | - | glasses.mp3 |
| hair | SM2_U6_A4_hair_1.mp3 | - | hair.mp3 |
| cheeks | SM2_U6_A5_cheeks_1.mp3 | - | cheeks.mp3 |
| ears | SM2_U6_A6_ears_1.mp3 | - | ears.mp3 |
| nose | SM2_U6_A7_nose_1.mp3 | - | nose.mp3 |
| tears | SM2_U6_A8_tears_1.mp3 | - | tears.mp3 |
| chin | SM2_U6_A9_chin_1.mp3 | - | chin.mp3 |
| mouth | SM2_U6_A10_mouth_1.mp3 | - | mouth.mp3 |
| helicopter | SM2_U7_A1_helicopter_1.mp3 | - | helicopter.mp3 |
| ship | SM2_U7_A2_ship_1.mp3 | - | ship.mp3 |
| truck | SM2_U7_A3_truck_1.mp3 | - | truck.mp3 |
| boat | SM2_U7_A4_boat_1.mp3 | SM2_U7_W4_boat_1.jpg | boat.jpg/mp3 |
| scooter | SM2_U7_A5_scooter_1.mp3 | SM2_U7_W5_scooter_1.jpg | scooter.jpg/mp3 |
| skateboard | SM2_U7_A6_skateboard_1.mp3 | - | skateboard.mp3 |
| motorcycle | SM2_U7_A7_motorcycle_1.mp3 | - | motorcycle.mp3 |
| taxi | SM2_U7_A8_taxi_1.mp3 | - | taxi.mp3 |
| bus | SM2_U7_A9_bus_1.mp3 | - | bus.mp3 |
| badminton | SM2_U8_A1_badminton_1.mp3 | - | badminton.mp3 |
| ping-pong | SM2_U8_A2_ping_pong_1.mp3 | - | ping-pong.mp3 |
| tennis | SM2_U8_A3_tennis_1.mp3 | - | tennis.mp3 |
| basketball | SM2_U8_A4_basketball_1.mp3 | - | basketball.mp3 |
| baseball | SM2_U8_A5_baseball_1.mp3 | - | baseball.mp3 |
| volleyball | SM2_U8_A6_volleyball_1.mp3 | - | volleyball.mp3 |
| swimming | SM2_U8_A7_swimming_1.mp3 | - | swimming.mp3 |
| soccer | SM2_U8_A8_soccer_1.mp3 | - | soccer.mp3 |
| field hockey | SM2_U8_A9_field_hockey_1.mp3 | - | field_hockey.mp3 |
| track and field | SM2_U8_A10_track_and_field_1.mp3 | - | track_and_field.mp3 |
| read a comic book | SM2_U9_A1_read_a_comic_book_1.mp3 | - | read_a_comic_book.mp3 |
| go hiking | SM2_U9_A2_go_hiking_1.mp3 | - | go_hiking.mp3 |
| visit my cousins | SM2_U9_A3_visit_my_cousins_1.mp3 | - | visit_my_cousins.mp3 |
| help in the yard | SM2_U9_A4_help_in_the_yard_1.mp3 | - | help_in_the_yard.mp3 |
| take horseback riding lessons | SM2_U9_A5_take_horseback_riding_lessons_1.mp3 | - | take_horseback_riding_lessons.mp3 |
| build a tree house | SM2_U9_A6_build_a_tree_house_1.mp3 | - | build_a_tree_house.mp3 |
| keep a scrapbook | SM2_U9_A7_keep_a_scrapbook_1.mp3 | - | keep_a_scrapbook.mp3 |
| learn to swim | SM2_U9_A8_learn_to_swim_1.mp3 | - | learn_to_swim.mp3 |
| go camping | SM2_U9_A9_go_camping_1.mp3 | - | go_camping.mp3 |

---

## Code Changes Required

### 1. Update `renderSpellingUI()` function in script.js

Add image display functionality:

```javascript
function renderSpellingUI() {
    grammarContainer.innerHTML = '';
    
    // ... existing code ...
    
    // Word display area with picture
    const wordDisplay = document.createElement('div');
    wordDisplay.className = 'spelling-word-display';
    
    // Picture display - load actual image
    const pictureDiv = document.createElement('div');
    pictureDiv.className = `spelling-picture ${spellingState.showPicture ? 'show' : ''}`;
    
    if (spellingState.showPicture) {
        const img = document.createElement('img');
        const imageName = getSimpleFileName(spellingState.currentWord);
        img.src = `static/imgs/words/${imageName}.jpg`;
        img.alt = spellingState.currentWord;
        img.onerror = () => {
            // Fallback to emoji if image not found
            pictureDiv.innerHTML = '🖼️';
        };
        img.onload = () => {
            pictureDiv.innerHTML = '';
            pictureDiv.appendChild(img);
        };
    } else {
        pictureDiv.innerHTML = '🖼️';
    }
    
    pictureDiv.style.cursor = 'pointer';
    pictureDiv.addEventListener('click', () => {
        playSpellingAudio();
    });
    wordDisplay.appendChild(pictureDiv);
    
    // ... rest of existing code ...
}
```

### 2. Update `playSpellingAudio()` function in script.js

Change from text-to-speech to audio file playback:

```javascript
function playSpellingAudio() {
    const audioName = getSimpleFileName(spellingState.currentWord);
    const audioPath = `static/audio/${audioName}.mp3`;
    
    // Try to play audio file
    const audio = new Audio(audioPath);
    audio.play().catch(() => {
        // Fallback to text-to-speech if audio file not found
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(spellingState.currentWord);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            window.speechSynthesis.speak(utterance);
        }
    });
}
```

### 3. Add helper function `getSimpleFileName()`

```javascript
function getSimpleFileName(word) {
    return word
        .toLowerCase()
        .replace(/ /g, '_')     // Replace spaces with underscores
        .replace(/-/g, '-');    // Keep hyphens as-is
}
```

---

## Renaming Script (PowerShell)

Save the following as `plans/rename_files.ps1` and run from project root:

```powershell
# PowerShell Script to Rename Audio and Image Files for Spelling Activity
Write-Host "Starting file renaming process..." -ForegroundColor Green

# ==================== AUDIO FILE RENAMES ====================
$audioRenames = @(
    @('SM1_U0_A1_Whisper_1.mp3', 'whisper.mp3'),
    @('SM1_U0_A2_Thunder_1.mp3', 'thunder.mp3'),
    @('SM1_U0_A3_Misty_1.mp3', 'misty.mp3'),
    @('SM1_U0_A4_Flash_1.mp3', 'flash.mp3'),
    @('SM1_U1_A1_ruler_1.mp3', 'ruler.mp3'),
    @('SM1_U1_A2_pen_1.mp3', 'pen.mp3'),
    @('SM1_U1_A3_book_1.mp3', 'book.mp3'),
    @('SM1_U1_A4_eraser_1.mp3', 'eraser.mp3'),
    @('SM1_U1_A5_pencil_case_1.mp3', 'pencil_case.mp3'),
    @('SM1_U1_A6_pencil_1.mp3', 'pencil.mp3'),
    @('SM1_U1_A7_desk_1.mp3', 'desk.mp3'),
    @('SM1_U1_A8_notebook_1.mp3', 'notebook.mp3'),
    @('SM1_U1_A9_bag_1.mp3', 'bag.mp3'),
    @('SM1_U1_A10_paper_1.mp3', 'paper.mp3'),
    @('SM1_U2_A1_computer_game_1.mp3', 'computer_game.mp3'),
    @('SM1_U2_A2_kite_1.mp3', 'kite.mp3'),
    @('SM1_U2_A3_plane_1.mp3', 'plane.mp3'),
    @('SM1_U2_A4_bike_1.mp3', 'bike.mp3'),
    @('SM1_U2_A5_doll_1.mp3', 'doll.mp3'),
    @('SM1_U2_A6_monster_1.mp3', 'monster.mp3'),
    @('SM1_U2_A7_train_1.mp3', 'train.mp3'),
    @('SM1_U2_A8_go_kart_1.mp3', 'go-kart.mp3'),
    @('SM1_U2_A9_car_1.mp3', 'car.mp3'),
    @('SM1_U2_A10_ball_1.mp3', 'ball.mp3'),
    @('SM1_U3_A1_donkey_1.mp3', 'donkey.mp3'),
    @('SM1_U3_A2_elephant_1.mp3', 'elephant.mp3'),
    @('SM1_U3_A3_spider_1.mp3', 'spider.mp3'),
    @('SM1_U3_A4_cat_1.mp3', 'cat.mp3'),
    @('SM1_U3_A5_rat_1.mp3', 'rat.mp3'),
    @('SM1_U3_A6_frog_1.mp3', 'frog.mp3'),
    @('SM1_U3_A7_duck_1.mp3', 'duck.mp3'),
    @('SM1_U3_A8_lizard_1.mp3', 'lizard.mp3'),
    @('SM1_U3_A9_dog_1.mp3', 'dog.mp3'),
    @('SM1_U4_A1_apple_1.mp3', 'apple.mp3'),
    @('SM1_U4_A2_banana_1.mp3', 'banana.mp3'),
    @('SM1_U4_A3_cake_1.mp3', 'cake.mp3'),
    @('SM1_U4_A4_pizza_1.mp3', 'pizza.mp3'),
    @('SM1_U4_A5_sausage_1.mp3', 'sausage.mp3'),
    @('SM1_U4_A6_cheese_sandwich_1.mp3', 'cheese_sandwich.mp3'),
    @('SM1_U4_A7_fish_1.mp3', 'fish.mp3'),
    @('SM1_U4_A8_chicken_1.mp3', 'chicken.mp3'),
    @('SM1_U4_A9_peas_1.mp3', 'peas.mp3'),
    @('SM1_U4_A10_steak_1.mp3', 'steak.mp3'),
    @('SM1_U4_A11_carrots_1.mp3', 'carrots.mp3'),
    @('SM1_U5_A1_Monday_1.mp3', 'monday.mp3'),
    @('SM1_U5_A2_Tuesday_1.mp3', 'tuesday.mp3'),
    @('SM1_U5_A3_Wednesday_1.mp3', 'wednesday.mp3'),
    @('SM1_U5_A4_Thursday_1.mp3', 'thursday.mp3'),
    @('SM1_U5_A5_Friday_1.mp3', 'friday.mp3'),
    @('SM1_U5_A6_Saturday_1.mp3', 'saturday.mp3'),
    @('SM1_U5_A7_Sunday_1.mp3', 'sunday.mp3'),
    @('SM1_U6_A1_bedroom_1.mp3', 'bedroom.mp3'),
    @('SM1_U6_A2_bathroom_1.mp3', 'bathroom.mp3'),
    @('SM1_U6_A3_living_room_1.mp3', 'living_room.mp3'),
    @('SM1_U6_A4_kitchen_1.mp3', 'kitchen.mp3'),
    @('SM1_U6_A5_hall_1.mp3', 'hall.mp3'),
    @('SM1_U6_A6_stairs_1.mp3', 'stairs.mp3'),
    @('SM1_U6_A7_basement_1.mp3', 'basement.mp3'),
    @('SM1_U6_A8_dining_room_1.mp3', 'dining_room.mp3'),
    @('SM1_U7_A1_sweater_1.mp3', 'sweater.mp3'),
    @('SM1_U7_A2_skirt_1.mp3', 'skirt.mp3'),
    @('SM1_U7_A3_shorts_1.mp3', 'shorts.mp3'),
    @('SM1_U7_A4_pants_1.mp3', 'pants.mp3'),
    @('SM1_U7_A5_jacket_1.mp3', 'jacket.mp3'),
    @('SM1_U7_A6_socks_1.mp3', 'socks.mp3'),
    @('SM1_U7_A7_jeans_1.mp3', 'jeans.mp3'),
    @('SM1_U7_A8_shoes_1.mp3', 'shoes.mp3'),
    @('SM1_U7_A9_baseball_cap_1.mp3', 'baseball_cap.mp3'),
    @('SM1_U7_A10_t_shirt_1.mp3', 't_shirt.mp3'),
    @('SM1_U8_A1_arm_1.mp3', 'arm.mp3'),
    @('SM1_U8_A2_hand_1.mp3', 'hand.mp3'),
    @('SM1_U8_A3_knee_1.mp3', 'knee.mp3'),
    @('SM1_U8_A4_fingers_1.mp3', 'fingers.mp3'),
    @('SM1_U8_A5_leg_1.mp3', 'leg.mp3'),
    @('SM1_U8_A6_foot_1.mp3', 'foot.mp3'),
    @('SM1_U8_A7_toes_1.mp3', 'toes.mp3'),
    @('SM1_U8_A8_head_1.mp3', 'head.mp3'),
    @('SM1_U9_A1_paint_a_picture_1.mp3', 'paint_a_picture.mp3'),
    @('SM1_U9_A2_listen_to_music_1.mp3', 'listen_to_music.mp3'),
    @('SM1_U9_A3_catch_a_fish_1.mp3', 'catch_a_fish.mp3'),
    @('SM1_U9_A4_take_a_photo_1.mp3', 'take_a_photo.mp3'),
    @('SM1_U9_A5_eat_ice_cream_1.mp3', 'eat_ice_cream.mp3'),
    @('SM1_U9_A6_play_the_guitar_1.mp3', 'play_the_guitar.mp3'),
    @('SM1_U9_A7_read_a_book_1.mp3', 'read_a_book.mp3'),
    @('SM1_U9_A8_make_a_sandcastle_1.mp3', 'make_a_sandcastle.mp3'),
    @('SM1_U9_A9_look_for_shells_1.mp3', 'look_for_shells.mp3'),
    @('SM2_U0_A1_bookcase_1.mp3', 'bookcase.mp3'),
    @('SM2_U0_A2_wall_1.mp3', 'wall.mp3'),
    @('SM2_U0_A3_board_1.mp3', 'board.mp3'),
    @('SM2_U0_A4_clock_1.mp3', 'clock.mp3'),
    @('SM2_U0_A5_door_1.mp3', 'door.mp3'),
    @('SM2_U0_A6_cabinet_1.mp3', 'cabinet.mp3'),
    @('SM2_U0_A7_window_1.mp3', 'window.mp3'),
    @('SM2_U0_A8_chair_1.mp3', 'chair.mp3'),
    @('SM2_U0_A9_crayon_1.mp3', 'crayon.mp3'),
    @('SM2_U0_A10_floor_1.mp3', 'floor.mp3'),
    @('SM2_U1_A1_get_up_1.mp3', 'get_up.mp3'),
    @('SM2_U1_A2_get_dressed_1.mp3', 'get_dressed.mp3'),
    @('SM2_U1_A3_have_breakfast_1.mp3', 'have_breakfast.mp3'),
    @('SM2_U1_A4_brush_your_teeth_1.mp3', 'brush_your_teeth.mp3'),
    @('SM2_U1_A5_go_to_school_1.mp3', 'go_to_school.mp3'),
    @('SM2_U1_A6_have_lunch_1.mp3', 'have_lunch.mp3'),
    @('SM2_U1_A7_play_in_the_park_1.mp3', 'play_in_the_park.mp3'),
    @('SM2_U1_A8_have_dinner_1.mp3', 'have_dinner.mp3'),
    @('SM2_U1_A9_go_to_bed_1.mp3', 'go_to_bed.mp3'),
    @('SM2_U2_A1_polar_bear_1.mp3', 'polar_bear.mp3'),
    @('SM2_U2_A2_bear_1.mp3', 'bear.mp3'),
    @('SM2_U2_A3_zebra_1.mp3', 'zebra.mp3'),
    @('SM2_U2_A4_crocodile_1.mp3', 'crocodile.mp3'),
    @('SM2_U2_A5_hippo_1.mp3', 'hippo.mp3'),
    @('SM2_U2_A6_tiger_1.mp3', 'tiger.mp3'),
    @('SM2_U2_A7_parrot_1.mp3', 'parrot.mp3'),
    @('SM2_U2_A8_monkey_1.mp3', 'monkey.mp3'),
    @('SM2_U2_A9_snake_1.mp3', 'snake.mp3'),
    @('SM2_U3_A1_train_station_1.mp3', 'train_station.mp3'),
    @('SM2_U3_A2_hospital_1.mp3', 'hospital.mp3'),
    @('SM2_U3_A3_movie_theater_1.mp3', 'movie_theater.mp3'),
    @('SM2_U3_A4_playground_1.mp3', 'playground.mp3'),
    @('SM2_U3_A5_cafe_1.mp3', 'cafe.mp3'),
    @('SM2_U3_A6_store_1.mp3', 'store.mp3'),
    @('SM2_U3_A7_street_1.mp3', 'street.mp3'),
    @('SM2_U3_A8_bus_stop_1.mp3', 'bus_stop.mp3'),
    @('SM2_U3_A9_park_1.mp3', 'park.mp3'),
    @('SM2_U3_A10_school_1.mp3', 'school.mp3'),
    @('SM2_U3_A11_swimming_pool_1.mp3', 'swimming_pool.mp3'),
    @('SM2_U4_A1_tomatoes_1.mp3', 'tomatoes.mp3'),
    @('SM2_U4_A2_beans_1.mp3', 'beans.mp3'),
    @('SM2_U4_A3_greens_1.mp3', 'greens.mp3'),
    @('SM2_U4_A4_potatoes_1.mp3', 'potatoes.mp3'),
    @('SM2_U4_A5_kiwis_1.mp3', 'kiwis.mp3'),
    @('SM2_U4_A6_lemons_1.mp3', 'lemons.mp3'),
    @('SM2_U4_A7_bread_1.mp3', 'bread.mp3'),
    @('SM2_U4_A8_mangoes_1.mp3', 'mangoes.mp3'),
    @('SM2_U4_A9_grapes_1.mp3', 'grapes.mp3'),
    @('SM2_U4_A10_eggs_1.mp3', 'eggs.mp3'),
    @('SM2_U4_A11_watermelons_1.mp3', 'watermelons.mp3'),
    @('SM2_U5_A1_poster_1.mp3', 'poster.mp3'),
    @('SM2_U5_A2_closet_1.mp3', 'closet.mp3'),
    @('SM2_U5_A3_mirror_1.mp3', 'mirror.mp3'),
    @('SM2_U5_A4_armchair_1.mp3', 'armchair.mp3'),
    @('SM2_U5_A5_lamp_1.mp3', 'lamp.mp3'),
    @('SM2_U5_A6_bed_1.mp3', 'bed.mp3'),
    @('SM2_U5_A7_table_1.mp3', 'table.mp3'),
    @('SM2_U5_A8_couch_1.mp3', 'couch.mp3'),
    @('SM2_U5_A9_rug_1.mp3', 'rug.mp3'),
    @('SM2_U6_A1_eyes_1.mp3', 'eyes.mp3'),
    @('SM2_U6_A2_face_1.mp3', 'face.mp3'),
    @('SM2_U6_A3_glasses_1.mp3', 'glasses.mp3'),
    @('SM2_U6_A4_hair_1.mp3', 'hair.mp3'),
    @('SM2_U6_A5_cheeks_1.mp3', 'cheeks.mp3'),
    @('SM2_U6_A6_ears_1.mp3', 'ears.mp3'),
    @('SM2_U6_A7_nose_1.mp3', 'nose.mp3'),
    @('SM2_U6_A8_tears_1.mp3', 'tears.mp3'),
    @('SM2_U6_A9_chin_1.mp3', 'chin.mp3'),
    @('SM2_U6_A10_mouth_1.mp3', 'mouth.mp3'),
    @('SM2_U7_A1_helicopter_1.mp3', 'helicopter.mp3'),
    @('SM2_U7_A2_ship_1.mp3', 'ship.mp3'),
    @('SM2_U7_A3_truck_1.mp3', 'truck.mp3'),
    @('SM2_U7_A4_boat_1.mp3', 'boat.mp3'),
    @('SM2_U7_A5_scooter_1.mp3', 'scooter.mp3'),
    @('SM2_U7_A6_skateboard_1.mp3', 'skateboard.mp3'),
    @('SM2_U7_A7_motorcycle_1.mp3', 'motorcycle.mp3'),
    @('SM2_U7_A8_taxi_1.mp3', 'taxi.mp3'),
    @('SM2_U7_A9_bus_1.mp3', 'bus.mp3'),
    @('SM2_U8_A1_badminton_1.mp3', 'badminton.mp3'),
    @('SM2_U8_A2_ping_pong_1.mp3', 'ping-pong.mp3'),
    @('SM2_U8_A3_tennis_1.mp3', 'tennis.mp3'),
    @('SM2_U8_A4_basketball_1.mp3', 'basketball.mp3'),
    @('SM2_U8_A5_baseball_1.mp3', 'baseball.mp3'),
    @('SM2_U8_A6_volleyball_1.mp3', 'volleyball.mp3'),
    @('SM2_U8_A7_swimming_1.mp3', 'swimming.mp3'),
    @('SM2_U8_A8_soccer_1.mp3', 'soccer.mp3'),
    @('SM2_U8_A9_field_hockey_1.mp3', 'field_hockey.mp3'),
    @('SM2_U8_A10_track_and_field_1.mp3', 'track_and_field.mp3'),
    @('SM2_U9_A1_read_a_comic_book_1.mp3', 'read_a_comic_book.mp3'),
    @('SM2_U9_A2_go_hiking_1.mp3', 'go_hiking.mp3'),
    @('SM2_U9_A3_visit_my_cousins_1.mp3', 'visit_my_cousins.mp3'),
    @('SM2_U9_A4_help_in_the_yard_1.mp3', 'help_in_the_yard.mp3'),
    @('SM2_U9_A5_take_horseback_riding_lessons_1.mp3', 'take_horseback_riding_lessons.mp3'),
    @('SM2_U9_A6_build_a_tree_house_1.mp3', 'build_a_tree_house.mp3'),
    @('SM2_U9_A7_keep_a_scrapbook_1.mp3', 'keep_a_scrapbook.mp3'),
    @('SM2_U9_A8_learn_to_swim_1.mp3', 'learn_to_swim.mp3'),
    @('SM2_U9_A9_go_camping_1.mp3', 'go_camping.mp3')
)

# ==================== IMAGE FILE RENAMES ====================
$imageRenames = @(
    @('SM0_U0_W1_blue_1.jpg', 'blue.jpg'),
    @('SM0_U0_W2_green_1.jpg', 'green.jpg'),
    @('SM0_U0_W3_yellow_1.jpg', 'yellow.jpg'),
    @('SM0_U0_W4_orange_1.jpg', 'orange.jpg'),
    @('SM0_U0_W5_red_1.jpg', 'red.jpg'),
    @('SM0_U0_W6_pink_1.jpg', 'pink.jpg'),
    @('SM0_U0_W7_one_1.jpg', 'one.jpg'),
    @('SM0_U0_W8_two_1.jpg', 'two.jpg'),
    @('SM0_U0_W9_three_1.jpg', 'three.jpg'),
    @('SM0_U0_W10_four_1.jpg', 'four.jpg'),
    @('SM0_U0_W11_five_1.jpg', 'five.jpg'),
    @('SM0_U0_W12_six_1.jpg', 'six.jpg'),
    @('SM0_U0_W13_seven_1.jpg', 'seven.jpg'),
    @('SM0_U0_W14_eight_1.jpg', 'eight.jpg'),
    @('SM0_U0_W15_nine_1.jpg', 'nine.jpg'),
    @('SM0_U0_W16_ten_1.jpg', 'ten.jpg'),
    @('SM0_U1_W1_window_1.jpg', 'window.jpg'),
    @('SM0_U1_W2_door_1.jpg', 'door.jpg'),
    @('SM0_U1_W3_chair_1.jpg', 'chair.jpg'),
    @('SM0_U1_W4_pencil_1.jpg', 'pencil.jpg'),
    @('SM0_U1_W5_book_1.jpg', 'book.jpg'),
    @('SM0_U1_W6_table_1.jpg', 'table.jpg'),
    @('SM0_U2_W1_eyes_1.jpg', 'eyes.jpg'),
    @('SM0_U2_W2_ears_1.jpg', 'ears.jpg'),
    @('SM0_U2_W3_arms_1.jpg', 'arms.jpg'),
    @('SM0_U2_W4_legs_1.jpg', 'legs.jpg'),
    @('SM0_U2_W5_mouth_1.jpg', 'mouth.jpg'),
    @('SM0_U2_W6_nose_1.jpg', 'nose.jpg'),
    @('SM0_U2_W7_head_1.jpg', 'head.jpg'),
    @('SM0_U3_W1_mom_1.jpg', 'mom.jpg'),
    @('SM0_U3_W2_dad_1.jpg', 'dad.jpg'),
    @('SM0_U3_W3_sister_1.jpg', 'sister.jpg'),
    @('SM0_U3_W4_brother_1.jpg', 'brother.jpg'),
    @('SM0_U3_W5_grandpa_1.jpg', 'grandpa.jpg'),
    @('SM0_U3_W6_grandma_1.jpg', 'grandma.jpg'),
    @('SM0_U4_W1_fish_1.jpg', 'fish.jpg'),
    @('SM0_U4_W2_parrot_1.jpg', 'parrot.jpg'),
    @('SM0_U4_W3_zebra_1.jpg', 'zebra.jpg'),
    @('SM0_U4_W4_lion_1.jpg', 'lion.jpg'),
    @('SM0_U4_W5_big_1.jpg', 'big.jpg'),
    @('SM0_U4_W6_small_1.jpg', 'small.jpg'),
    @('SM0_U5_W1_milk_1.jpg', 'milk.jpg'),
    @('SM0_U5_W2_cupcakes_1.jpg', 'cupcakes.jpg'),
    @('SM0_U5_W3_oranges_1.jpg', 'oranges.jpg'),
    @('SM0_U5_W4_tomatoes_1.jpg', 'tomatoes.jpg'),
    @('SM0_U5_W5_chocolate_1.jpg', 'chocolate.jpg'),
    @('SM0_U5_W6_pears_1.jpg', 'pears.jpg'),
    @('SM0_U6_W1_bus_stop_1.jpg', 'bus_stop.jpg'),
    @('SM0_U6_W2_school_1.jpg', 'school.jpg'),
    @('SM0_U6_W3_movie_theater_1.jpg', 'movie_theater.jpg'),
    @('SM0_U6_W4_hospital_1.jpg', 'hospital.jpg'),
    @('SM0_U6_W5_toy_store_1.jpg', 'toy_store.jpg'),
    @('SM0_U6_W6_park_1.jpg', 'park.jpg'),
    @('SM0_U7_W1_teacher_1.jpg', 'teacher.jpg'),
    @('SM0_U7_W2_firefighter_1.jpg', 'firefighter.jpg'),
    @('SM0_U7_W3_gardener_1.jpg', 'gardener.jpg'),
    @('SM0_U7_W4_police_officer_1.jpg', 'police_officer.jpg'),
    @('SM0_U7_W5_vet_1.jpg', 'vet.jpg'),
    @('SM0_U7_W6_doctor_1.jpg', 'doctor.jpg'),
    @('SM0_U8_W1_hat_1.jpg', 'hat.jpg'),
    @('SM0_U8_W2_coat_1.jpg', 'coat.jpg'),
    @('SM0_U8_W3_sweater_1.jpg', 'sweater.jpg'),
    @('SM0_U8_W4_scarf_1.jpg', 'scarf.jpg'),
    @('SM0_U8_W5_gloves_1.jpg', 'gloves.jpg'),
    @('SM0_U8_W6_jeans_1.jpg', 'jeans.jpg'),
    @('SM0_U8_W7_t_shirt_1.jpg', 't_shirt.jpg'),
    @('SM0_U8_W8_boots_1.jpg', 'boots.jpg'),
    @('SM0_U9_W1_play_soccer_1.jpg', 'play_soccer.jpg'),
    @('SM0_U9_W2_run_1.jpg', 'run.jpg'),
    @('SM0_U9_W3_paint_a_picture_1.jpg', 'paint_a_picture.jpg'),
    @('SM0_U9_W4_swim_1.jpg', 'swim.jpg'),
    @('SM0_U9_W5_read_1.jpg', 'read.jpg'),
    @('SM0_U9_W6_dance_1.jpg', 'dance.jpg'),
    @('SM1_U0_W1_whisper_1.jpg', 'whisper.jpg'),
    @('SM1_U0_W2_Thunder_1.jpg', 'thunder.jpg'),
    @('SM1_U0_W3_Misty_1.jpg', 'misty.jpg'),
    @('SM1_U0_W4_Flash_1.jpg', 'flash.jpg'),
    @('SM1_U1_W1_ruler_1.jpg', 'ruler.jpg'),
    @('SM1_U1_W2_pen_1.jpg', 'pen.jpg'),
    @('SM1_U1_W3_book_1.jpg', 'book.jpg'),
    @('SM1_U1_W4_eraser_1.jpg', 'eraser.jpg'),
    @('SM1_U1_W5_pencil_case_1.jpg', 'pencil_case.jpg'),
    @('SM1_U1_W6_pencil_1.jpg', 'pencil.jpg'),
    @('SM1_U1_W7_desk_1.jpg', 'desk.jpg'),
    @('SM1_U1_W8_notebook_1.jpg', 'notebook.jpg'),
    @('SM1_U1_W9_bag_1.jpg', 'bag.jpg'),
    @('SM1_U1_W10_paper_1.jpg', 'paper.jpg'),
    @('SM1_U2_W1_computer_game_1.jpg', 'computer_game.jpg'),
    @('SM1_U2_W2_kite_1.jpg', 'kite.jpg'),
    @('SM1_U2_W3_plane_1.jpg', 'plane.jpg'),
    @('SM1_U2_W4_bike_1.jpg', 'bike.jpg'),
    @('SM1_U2_W5_doll_1.jpg', 'doll.jpg'),
    @('SM1_U2_W6_monster_1.jpg', 'monster.jpg'),
    @('SM1_U2_W7_train_1.jpg', 'train.jpg'),
    @('SM1_U2_W8_go_kart_1.jpg', 'go-kart.jpg'),
    @('SM1_U2_W9_car_1.jpg', 'car.jpg'),
    @('SM1_U2_W10_ball_1.jpg', 'ball.jpg'),
    @('SM1_U3_W1_donkey_1.jpg', 'donkey.jpg'),
    @('SM1_U3_W2_elephant_1.jpg', 'elephant.jpg'),
    @('SM1_U3_W3_spider_1.jpg', 'spider.jpg'),
    @('SM1_U3_W4_cat_1.jpg', 'cat.jpg'),
    @('SM1_U3_W5_rat_1.jpg', 'rat.jpg'),
    @('SM1_U3_W6_frog_1.jpg', 'frog.jpg'),
    @('SM1_U3_W7_duck_1.jpg', 'duck.jpg'),
    @('SM1_U3_W8_lizard_1.jpg', 'lizard.jpg'),
    @('SM1_U3_W9_dog_1.jpg', 'dog.jpg'),
    @('SM1_U4_W1_apple_1.jpg', 'apple.jpg'),
    @('SM1_U4_W2_banana_1.jpg', 'banana.jpg'),
    @('SM1_U4_W3_cake_1.jpg', 'cake.jpg'),
    @('SM1_U4_W4_pizza_1.jpg', 'pizza.jpg'),
    @('SM1_U4_W5_sausage_1.jpg', 'sausage.jpg'),
    @('SM1_U4_W6_cheese_sandwich_1.jpg', 'cheese_sandwich.jpg'),
    @('SM1_U4_W7_fish_1.jpg', 'fish.jpg'),
    @('SM1_U4_W8_chicken_1.jpg', 'chicken.jpg'),
    @('SM1_U4_W9_peas_1.jpg', 'peas.jpg'),
    @('SM1_U4_W10_steak_1.jpg', 'steak.jpg'),
    @('SM1_U4_W11_carrots_1.jpg', 'carrots.jpg'),
    @('SM1_U5_W1_Monday_1.jpg', 'monday.jpg'),
    @('SM1_U5_W2_Tuesday_1.jpg', 'tuesday.jpg'),
    @('SM1_U5_W3_Wednesday_1.jpg', 'wednesday.jpg'),
    @('SM1_U5_W4_Thursday_1.jpg', 'thursday.jpg'),
    @('SM1_U5_W5_Friday_1.jpg', 'friday.jpg'),
    @('SM1_U5_W6_Saturday_1.jpg', 'saturday.jpg'),
    @('SM1_U5_W7_Sunday_1.jpg', 'sunday.jpg'),
    @('SM1_U6_W1_bedroom_1.jpg', 'bedroom.jpg'),
    @('SM1_U6_W2_bathroom_1.jpg', 'bathroom.jpg'),
    @('SM1_U6_W3_living_room_1.jpg', 'living_room.jpg'),
    @('SM1_U6_W4_kitchen_1.jpg', 'kitchen.jpg'),
    @('SM1_U6_W5_hall_1.jpg', 'hall.jpg'),
    @('SM1_U6_W6_stairs_1.jpg', 'stairs.jpg'),
    @('SM1_U6_W7_basement_1.jpg', 'basement.jpg'),
    @('SM1_U6_W8_dining_room_1.jpg', 'dining_room.jpg'),
    @('SM1_U7_W1_sweater_1.jpg', 'sweater.jpg'),
    @('SM1_U7_W2_skirt_1.jpg', 'skirt.jpg'),
    @('SM1_U7_W3_shorts_1.jpg', 'shorts.jpg'),
    @('SM1_U7_W4_pants_1.jpg', 'pants.jpg'),
    @('SM1_U7_W5_jacket_1.jpg', 'jacket.jpg'),
    @('SM1_U7_W6_socks_1.jpg', 'socks.jpg'),
    @('SM1_U7_W7_jeans_1.jpg', 'jeans.jpg'),
    @('SM1_U7_W8_shoes_1.jpg', 'shoes.jpg'),
    @('SM1_U7_W9_baseball_cap_1.jpg', 'baseball_cap.jpg'),
    @('SM1_U7_W10_t_shirt_1.jpg', 't_shirt.jpg'),
    @('SM1_U8_W1_arm_1.jpg', 'arm.jpg'),
    @('SM1_U8_W2_hand_1.jpg', 'hand.jpg'),
    @('SM1_U8_W3_knee_1.jpg', 'knee.jpg'),
    @('SM1_U8_W4_fingers_1.jpg', 'fingers.jpg'),
    @('SM1_U8_W5_leg_1.jpg', 'leg.jpg'),
    @('SM1_U8_W6_foot_1.jpg', 'foot.jpg'),
    @('SM1_U8_W7_toes_1.jpg', 'toes.jpg'),
    @('SM1_U8_W8_head_1.jpg', 'head.jpg'),
    @('SM1_U9_W1_paint_a_picture_1.jpg', 'paint_a_picture.jpg'),
    @('SM1_U9_W2_listen_to_music_1.jpg', 'listen_to_music.jpg'),
    @('SM1_U9_W3_catch_a_fish_1.jpg', 'catch_a_fish.jpg'),
    @('SM1_U9_W4_take_a_photo_1.jpg', 'take_a_photo.jpg'),
    @('SM1_U9_W5_eat_ice_cream_1.jpg', 'eat_ice_cream.jpg'),
    @('SM1_U9_W6_play_the_guitar_1.jpg', 'play_the_guitar.jpg'),
    @('SM1_U9_W7_read_a_book_1.jpg', 'read_a_book.jpg'),
    @('SM1_U9_W8_make_a_sandcastle_1.jpg', 'make_a_sandcastle.jpg'),
    @('SM1_U9_W9_look_for_shells_1.jpg', 'look_for_shells.jpg'),
    @('SM2_U0_W1_bookcase_1.jpg', 'bookcase.jpg'),
    @('SM2_U0_W2_wall_1.jpg', 'wall.jpg'),
    @('SM2_U0_W3_board_1.jpg', 'board.jpg'),
    @('SM2_U0_W4_clock_1.jpg', 'clock.jpg'),
    @('SM2_U0_W5_door_1.jpg', 'door.jpg'),
    @('SM2_U0_W6_cabinet_1.jpg', 'cabinet.jpg'),
    @('SM2_U0_W7_window_1.jpg', 'window.jpg'),
    @('SM2_U0_W8_chair_1.jpg', 'chair.jpg'),
    @('SM2_U0_W9_crayon_1.jpg', 'crayon.jpg'),
    @('SM2_U0_W10_floor_1.jpg', 'floor.jpg'),
    @('SM2_U1_W1_get_up_1.jpg', 'get_up.jpg'),
    @('SM2_U1_W2_get_dressed_1.jpg', 'get_dressed.jpg'),
    @('SM2_U1_W3_have_breakfast_1.jpg', 'have_breakfast.jpg'),
    @('SM2_U1_W4_brush_your_teeth_1.jpg', 'brush_your_teeth.jpg'),
    @('SM2_U3_W1_train_station_1.jpg', 'train_station.jpg'),
    @('SM2_U3_W2_hospital_1.jpg', 'hospital.jpg'),
    @('SM2_U3_W3_movie_theater_1.jpg', 'movie_theater.jpg'),
    @('SM2_U3_W4_playground_1.jpg', 'playground.jpg'),
    @('SM2_U3_W5_cafe_1.jpg', 'cafe.jpg'),
    @('SM2_U3_W6_store_1.jpg', 'store.jpg'),
    @('SM2_U3_W7_street_1.jpg', 'street.jpg'),
    @('SM2_U3_W8_bus_stop_1.jpg', 'bus_stop.jpg'),
    @('SM2_U3_W9_park_1.jpg', 'park.jpg'),
    @('SM2_U4_W1_tomatoes_1.jpg', 'tomatoes.jpg'),
    @('SM2_U4_W10_eggs_1.jpg', 'eggs.jpg'),
    @('SM2_U4_W11_watermelons_1.jpg', 'watermelons.jpg'),
    @('SM2_U7_W4_boat_1.jpg', 'boat.jpg'),
    @('SM2_U7_W5_scooter_1.jpg', 'scooter.jpg'),
    @('SM6_U1_W1_palm_tree_1.jpg', 'palm_tree.jpg'),
    @('SM6_U1_W2_hook_1.jpg', 'hook.jpg'),
    @('SM6_U1_W3_eyepatch_1.jpg', 'eyepatch.jpg'),
    @('SM6_U1_W4_binoculars_1.jpg', 'binoculars.jpg'),
    @('SM6_U1_W5_key_1.jpg', 'key.jpg'),
    @('SM6_U1_W6_hammock_1.jpg', 'hammock.jpg'),
    @('SM6_U1_W7_coins_1.jpg', 'coins.jpg'),
    @('SM6_U1_W8_shovel_1.jpg', 'shovel.jpg'),
    @('SM6_U1_W9_treasure_chest_1.jpg', 'treasure_chest.jpg'),
    @('SM6_U2_W1_hang_glider_1.jpg', 'hang_glider.jpg'),
    @('SM6_U2_W2_parachute_1.jpg', 'parachute.jpg'),
    @('SM6_U2_W3_monorail_1.jpg', 'monorail.jpg')
)

# ==================== EXECUTE RENAMES ====================
$audioSuccess = 0; $audioNotFound = 0
$imageSuccess = 0; $imageNotFound = 0

Write-Host "`nProcessing audio files..." -ForegroundColor Cyan
foreach ($rename in $audioRenames) {
    $oldPath = "static/audio/$($rename[0])"
    $newPath = "static/audio/$($rename[1])"
    if (Test-Path $oldPath) {
        Move-Item -Path $oldPath -Destination $newPath -Force
        Write-Host "  RENAMED: $($rename[0]) -> $($rename[1])" -ForegroundColor Green
        $audioSuccess++
    } else {
        $audioNotFound++
    }
}

Write-Host "`nProcessing image files..." -ForegroundColor Cyan
foreach ($rename in $imageRenames) {
    $oldPath = "static/imgs/words/$($rename[0])"
    $newPath = "static/imgs/words/$($rename[1])"
    if (Test-Path $oldPath) {
        Move-Item -Path $oldPath -Destination $newPath -Force
        Write-Host "  RENAMED: $($rename[0]) -> $($rename[1])" -ForegroundColor Green
        $imageSuccess++
    } else {
        $imageNotFound++
    }
}

Write-Host "`nAudio: $audioSuccess renamed, $audioNotFound not found"
Write-Host "Images: $imageSuccess renamed, $imageNotFound not found"
```

---

## Files to Create/Modify

1. **plans/rename_files.ps1** - PowerShell script to rename all media files
2. **script.js** - Update spelling UI and audio functions
3. **styles.css** - Add styles for actual images in spelling activity

---

## Notes

- Multi-word phrases use underscores: "bus stop" → "bus_stop.mp3"
- Hyphens are preserved: "go-kart" → "go-kart.mp3"
- Case is normalized to lowercase
- Fallback mechanisms included for missing files
- The database (amity.db) can be used as reference but is not required after renaming

---

## Testing Checklist

- [ ] All audio files renamed correctly
- [ ] All image files renamed correctly
- [ ] Images display in spelling activity
- [ ] Audio plays when clicking picture/audio button
- [ ] Fallback to text-to-speech works for missing audio
- [ ] Fallback to emoji works for missing images
- [ ] Multi-word phrases work correctly
- [ ] Hyphenated words work correctly
