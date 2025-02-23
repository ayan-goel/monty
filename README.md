# Monty

## Inspiration

The inspiration behind this project was to create a tool for users to implement their own algorithms to help them conduct trades on the stock market. We designed the app so that users could choose certain parameters for entering and exiting a position and backtest their algorithms based on both historical market data and simulations using Monte Carlo simulations.

## What It Does

The app allows users to experiment with different stop and end conditions for a position. Users can set these conditions based on various technical indicators, such as the RSI, SMA, EMA, MACD, and Bollinger Bands. Once the user inputs these parameters, along with a specific time interval for historical analysis, the app calculates the trades that the user would have made according to their algorithmic decisions. This enables users to evaluate their own algorithms efficiently. Before this app, this process had to be done manually, requiring users to hypothesize market behavior. Now, with automated Monte Carlo simulations and historical data, this process is streamlined and efficient.

## How We Built It

To build the app, we used:

Languages & Frameworks: Python, JavaScript, HTML

Tech Stack: React (frontend) and FastAPI (backend)

APIs: Polygon API and yFinance for stock data

AI Integration: NVIDIA NIM API for LLM-driven strategy suggestions

Deployment: AWS

## Challenges We Ran Into

Backend-Frontend Integration: Integrating technical indicators and Monte Carlo simulations posed challenges due to CORS issues and JSON parsing problems.

API Limitations: Initially, we used the Polygon API for historical data comparisons, but its limit of 5 calls per minute was restrictive, so we switched to Yahoo Finance API.

Monte Carlo Simulation: Connecting the simulation output to the project’s architecture was challenging and required extensive debugging.

## Accomplishments That We're Proud Of

Fully Functional Web App: Monty is a deployed application that provides real benefits to stock traders.

Creative Integration of Monte Carlo Simulations: Users can test strategies not just on historical data but also on potential future stock performance.

AI-Powered Strategy Enhancement: The LLM analyzes strategy performance and suggests improvements.

Robust Tech Stack: Successfully built a scalable, clean solution with React and FastAPI.

## What We Learned

How to integrate financial data and LLMs into a full-stack application.

Connecting a frontend UI with a FastAPI backend.

Developing custom FastAPI endpoints that process financial data and communicate with React.

## What's Next for Monty

Additional Technical Indicators: Expanding the variety of supported indicators.

UI Improvements: Making the frontend more interactive and user-friendly.

Enhanced Monte Carlo Simulations: Improving accuracy for better trade predictions.

User-Defined Time Stamps: Enabling users to select their own timestamps rather than relying on daily average prices.

🚀 Stay Tuned for More Updates!

