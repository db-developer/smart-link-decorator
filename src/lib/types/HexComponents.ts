/**
 * Represents the individual hex components of a color in HTML/CSS hex format.
 *
 * Each field corresponds to a two-digit hexadecimal component of a color
 * in the form "#RRGGBBAA":
 * - r: Red component (00–FF)
 * - g: Green component (00–FF)
 * - b: Blue component (00–FF)
 * - a: Alpha component (00–FF) or null if not specified
 *
 * Notes:
 * - All components are stored as strings to allow direct assembly into
 *   standard hex color strings for CSS, e.g., "#RRGGBB" or "#RRGGBBAA".
 * - Null alpha indicates full opacity and can be omitted when constructing
 *   the CSS hex string.
 */
export interface HexComponents {
    r: string;
    g: string;
    b: string;
    a: string | null;
}