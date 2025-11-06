import { responsiveFontSizes } from "@mui/material/styles";
import createThemeFromTokens from "./factory";
import lightPaletteTokens from "./palettes/lightPalette";

let theme = createThemeFromTokens(lightPaletteTokens);
theme = responsiveFontSizes(theme);
export default theme;
