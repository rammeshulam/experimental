import streamlit as st
import google.generativeai as palm
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

def create_image(image, size, font, message):
    """Adds text to the center of a given image"""

    W, H = size
    draw = ImageDraw.Draw(image)
    _, _, w, h = draw.textbbox((0, 0), message, font=font)
    draw.text(((W-w)/2, (H-h)/2), message, fill='blue', font=font)
    return image

#read the prompt
path = Path(__file__).parents[0]
context = ''
with open(path/'prompt.txt') as f:
    context = f.read()

#Draw the app and form
st.title("Poetic Happy New Year")

with st.form("greeting_input", clear_on_submit=False):
    st.markdown("Recipient's name:")
    recipient = st.text_input(
        label="Recipient Name:",
        placeholder="Recipient Name",
        label_visibility="collapsed"
    )

    st.markdown("4-5 things they love. They love... ")
    fun_facts = st.text_input(
        label="Complete the sentence: They love...",
        placeholder="develop code, go to the beach, \
pizza, their dog Jessica and reading books",
        label_visibility="collapsed"
    )

    st.form_submit_button("Send", use_container_width=True)

#configure the model
try:
    palm.configure(api_key=st.secrets.palm_api_key)
except Exception as e:
    print(e)
    st.info("Please pass a valid API key")

#given the inputs, generate a personal poem
if (fun_facts and recipient):
    
    response = palm.generate_text(
        prompt=context.format(recipient=recipient, fun_facts=fun_facts), 
        temperature=0.05)
    
    poem = response.result.replace('\n','\n\n')
    
    # Add the generated poem to the background image
    font_path = str(path/"KirimomiSwaIt.ttf")
    font = ImageFont.truetype(font_path, 35)
    
    bg_path = str(path/'shana-tova-bg.jpeg')
    i = create_image(Image.open(bg_path), (1024,1024), font, poem)
    
    st.image(i)