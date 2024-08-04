'use client'
import Image from "next/image";
import { useState, useEffect, useRef } from 'react';
import { firestore } from "@/firebase";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { Box, Modal, InputAdornment, TextField, Typography, Button, Container, Grid, Card, CardContent, CardMedia, IconButton, Input } from "@mui/material";
import { collection, deleteDoc, getDocs, query, setDoc, getDoc, doc } from "firebase/firestore";
import { Camera } from "react-camera-pro";
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import CircularProgress from '@mui/material/CircularProgress';
import SearchIcon from '@mui/icons-material/Search';
import { OpenAI } from "openai";

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
  typography: {
    fontFamily: '"Helvetica Neue", Arial, sans-serif',
  },
});

export default function Home() {
  const [pantry, setPantry] = useState([])
  const [filteredPantry, setFilteredPantry] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [open, setOpen] = useState(false)
  const [itemName, setItemName] = useState('')
  const [recipe, setRecipe] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showCamera, setShowCamera] = useState(false)
  const [image, setImage] = useState(null)
  const camera = useRef(null)

  const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  });

  const updatePantry = async () => {
    const snapshot = query(collection(firestore, 'pantry'))
    const docs = await getDocs(snapshot)
    const pantryList = []
    docs.forEach((doc) => {
      pantryList.push({
        name: doc.id,
        ...doc.data(),
      })
    })
    setPantry(pantryList)
    setFilteredPantry(pantryList)
  }

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item)
    const docSnap = await getDoc(docRef)

    if(docSnap.exists()){
      const {quantity} = docSnap.data()
      if (quantity === 1){
        await deleteDoc(docRef)
      } else {
        await setDoc(docRef, {quantity: quantity - 1})
      }
    }

    await updatePantry()
  }

  const addItem = async (item) => {
    const docRef = doc(collection(firestore, 'pantry'), item)
    const docSnap = await getDoc(docRef)

    if(docSnap.exists()){
      const {quantity, image: existingImage} = docSnap.data()
      await setDoc(docRef, {quantity: quantity + 1, image: image || existingImage})
    } else {
      await setDoc(docRef, {quantity: 1, image})
    }

    await updatePantry()
    setImage(null)
  }

  const getRecipeSuggestion = async () => {
    setIsLoading(true)
    const ingredients = pantry.map(item => item.name).join(',')
    console.log('Ingredients: ', ingredients);

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {"role": "system", "content": "You are a helpful chef assistant. Suggest a recipe based on the given ingredients."},
          {"role": "user", "content": `Suggest a recipe using some or all of these ingredients: ${ingredients}`}
        ],
        max_tokens: 300,
        temperature: 0.7,
      });
      setRecipe(response.choices[0].message.content);
      
    } catch (err) {
      console.error('Error fetching recipe: ', err);
      setRecipe('Sorry, there was an error getting a recipe suggestion. Please add more items to your pantry and try again.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    updatePantry()
  }, [])

  useEffect(() => {
    const filtered = pantry.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredPantry(filtered);
  }, [searchTerm, pantry]);

  const handleOpen = () => setOpen(true)
  const handleClose = () => {
    setOpen(false)
    setShowCamera(false)
    setImage(null)
  }

  const handleTakePhoto = () => {
    const photo = camera.current.takePhoto()
    setImage(photo)
    setShowCamera(false)
  }

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
  }

  return (
    <ThemeProvider theme={theme}>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center" color="primary">
          Pantry Manager
        </Typography>
        <Box display="flex" justifyContent="center" mb={4} gap={2}> 
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpen}
            size="large"
          >
            Add New Item
          </Button>
          <TextField
            variant="outlined"
            placeholder="Search pantry items"

            value={searchTerm}
            onChange={handleSearch}
            InputProps={{
              startAdornment : (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        <Grid container spacing={3}>
          {filteredPantry.map(({name, quantity, image}) => (
            <Grid item xs={12} sm={6} md={4} key={name}>
              <Card>
                <CardMedia
                  component="img"
                  height="140"
                  image={image || '/placeholder-image.webp'}
                  alt={name}
                />
                <CardContent>
                  <Typography variant="h5" component="div">
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Quantity: {quantity}
                  </Typography>
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <IconButton onClick={() => removeItem(name)} color="secondary">
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Box mt={4} display="flex" flexDirection="column" alignItems="center">
          <Button
            variant="contained"
            color="secondary"
            startIcon={<RestaurantIcon />}
            onClick={getRecipeSuggestion}
            disabled={isLoading || pantry.length === 0}
            size="large"
          >
            Get Magic Recipes
          </Button>
          {isLoading && (
            <Box mt={2}>
              <CircularProgress />
            </Box>
          )}
          {recipe && (
            <Card sx={{ mt: 2, width: '100%', maxWidth: 600 }}>
              <CardContent>
                <Typography variant="h5" component="div" gutterBottom>
                  Recipe Suggestion
                </Typography>
                <Typography variant="body1">
                  {recipe}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>

        <Modal open={open} onClose={handleClose}>
          <Box
            sx={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: {xs: '90%', sm: '400px'},
              bgcolor: 'background.paper',
              boxShadow: 24,
              p: 4,
              borderRadius: 2,
            }}
          >
            <Typography variant="h6" component="h2" gutterBottom>
              Add Item
            </Typography>
            {showCamera ? (
              <Box>
                <Camera ref={camera} aspectRatio={16 / 9} />
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={handleTakePhoto} 
                  sx={{ mt: 2 }}
                >
                  Take Photo
                </Button>
              </Box>
            ) : (
              <Box>
                <TextField 
                  fullWidth
                  variant="outlined"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  placeholder="Item name"
                  sx={{ mb: 2 }}
                />
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={() => {
                    addItem(itemName)
                    setItemName('')
                    handleClose()
                  }}
                  disabled={!itemName.trim()}
                  sx={{ mb: 2 }}
                >
                  Add Item
                </Button>
                {image ? (
                  <Box 
                    component="img" 
                    src={image} 
                    alt="Item" 
                    sx={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: 1 }} 
                  />
                ) : (
                  <Button 
                    fullWidth 
                    variant="outlined" 
                    onClick={() => setShowCamera(true)}
                    startIcon={<CameraAltIcon />}
                  >
                    Take Photo
                  </Button>
                )}
              </Box>
            )}
          </Box>
        </Modal>
      </Container>
    </ThemeProvider>
  )
}