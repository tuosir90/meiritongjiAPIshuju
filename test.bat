@echo off
echo Test 1: Basic echo
pause

echo Test 2: Current directory
cd
pause

echo Test 3: List files
dir
pause

echo Test 4: Check node
where node
echo errorlevel: %errorlevel%
pause

echo Test 5: Node version
node -v
pause

echo All tests completed
pause
