import face_recognition
from PIL import Image, ImageDraw


def process(image, filter_image, position):
    image = face_recognition.load_image_file(image)
    face_location_list = face_recognition.face_locations(image)
    face_landmarks_list = face_recognition.face_landmarks(image)
    filter_image = Image.open(filter_image).convert("RGBA")

    process_image = Image.fromarray(image)
    for face_landmarks in face_landmarks_list:
        print(face_landmarks.keys())
    for face_location in face_location_list:
        # top right bottom left
        d = ImageDraw.Draw(process_image, "RGB")
        d.rectangle(face_location, outline=(0, 0, 0))
        width = face_location[1] - face_location[3]
        height = face_location[2] - face_location[0]
        ratio = width / filter_image.size[0] * 1.5
        filter_image = filter_image.resize(
            ((int)(filter_image.size[0] * ratio), (int)(filter_image.size[1] * ratio)))
        filter_pos = (face_location[0] - (int)((filter_image.size[0] - width) / 2),
                      face_location[3] - filter_image.size[1])
        print(filter_pos)
        process_image.paste(filter_image, filter_pos,
                            mask=filter_image.split()[3])

    return process_image


process("./demo_image.png", "./demo_filter.png", None).show()
process("./demo_image_2.jpg", "./demo_filter.png", None).show()