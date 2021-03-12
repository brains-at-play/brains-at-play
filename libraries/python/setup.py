from distutils.core import setup
import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

setup(
    name = 'brainsatplay',         # How you named your package folder (MyLib)
    packages=setuptools.find_packages(),
    version = '0.0.7',      # Start with a small number and increase it with every change you make
    license='MIT',        # Chose a license from here: https://help.github.com/articles/licensing-a-repository
    description = 'Stream brain data into the web',   # Give a short description about your library
    long_description=long_description,
    long_description_content_type="text/markdown",
    author = 'Garrett Flynn',                   # Type in your name
    author_email = 'gflynn@usc.edu',      # Type in your E-Mail
    url = 'https://github.com/garrettmflynn',   # Provide either the link to your github or to your website
    keywords = ['BCI', 'neuroscience'],   # Keywords that define your package best
    classifiers=[
        'Development Status :: 3 - Alpha', 
        'Intended Audience :: Developers',
        'License :: OSI Approved :: MIT License', 
        'Programming Language :: Python :: 3.8',
    ],
    install_requires=[ 
        'brainflow',
        'websockets',
        'requests',
      ],
)