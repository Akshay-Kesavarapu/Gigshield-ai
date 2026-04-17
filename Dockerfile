# ==========================================
# STAGE 1: Build the React Code
# ==========================================
FROM node:20-alpine AS builder

# Set working directory inside the container
WORKDIR /app

# Copy package dependencies
COPY package.json package-lock.json ./

# Install packages
RUN npm ci

# Copy the entire project code into the container
COPY . .

# Build the production optimized bundle (Vite outputs to /dist)
RUN npm run build

# ==========================================
# STAGE 2: Serve the App using Nginx
# ==========================================
FROM nginx:alpine

# Remove the default Nginx index.html
RUN rm -rf /usr/share/nginx/html/*

# Copy the custom Nginx configuration we created to support React Router
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the Vite react build output from Stage 1 into Nginx Web Root
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80 to the outside
EXPOSE 80

# Starts Nginx automatically
CMD ["nginx", "-g", "daemon off;"]
