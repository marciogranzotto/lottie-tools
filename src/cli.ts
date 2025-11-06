#!/usr/bin/env node

/**
 * CLI Interface for Lottie to GIF Converter
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as path from 'path';
import * as fs from 'fs';
import { convertLottieToGif, validateConfig } from './converter';
import { ConversionConfig } from './types/config';

// Read package.json for version
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../package.json'), 'utf-8')
);

/**
 * Main CLI program
 */
const program = new Command();

program
  .name('lottie-to-gif')
  .description('Convert Lottie JSON animations to animated GIF files')
  .version(packageJson.version, '-v, --version', 'Output the version number')
  .argument('<input>', 'Input Lottie JSON file path')
  .option('-o, --output <path>', 'Output GIF file path (default: output/filename.gif)')
  .option('--fps <number>', 'Frames per second (default: source animation FPS)', parseFloat)
  .option('--width <pixels>', 'Output width in pixels (default: source width)', parseInt)
  .option('--height <pixels>', 'Output height in pixels (default: source height)', parseInt)
  .option('--scaled <number>', 'Scale multiplier (e.g., 2 = 2x size, overrides width/height)', parseFloat)
  .option('--bg <color>', 'Background color in hex format (e.g., FFFFFF or FFFFFFFF with alpha)')
  .option('--quality <number>', 'Quality level 1-100 (default: 80)', parseInt)
  .option('--dither', 'Enable dithering for better color representation', false)
  .option('--no-loop', 'Disable looping (default: loop forever)')
  .option('--repeat <times>', 'Repeat count (0 = no repeat, n = repeat n times)', parseInt)
  .option('--timeout <ms>', 'Rendering timeout in milliseconds (default: 60000)', parseInt)
  .option('--verbose', 'Enable verbose logging', false)
  .option('--dry-run', 'Preview conversion settings without actually converting', false)
  .option('--no-progress', 'Disable progress indicators', false)
  .addHelpText('after', `
Examples:
  $ lottie-to-gif animation.json
  $ lottie-to-gif animation.json -o output.gif
  $ lottie-to-gif animation.json --fps 30 --width 800 --height 600
  $ lottie-to-gif animation.json --scaled 2
  $ lottie-to-gif animation.json --bg FFFFFF
  $ lottie-to-gif animation.json --bg FF000080
  $ lottie-to-gif animation.json --quality 90 --dither
  $ lottie-to-gif animation.json --no-loop
  $ lottie-to-gif animation.json --repeat 3
  $ lottie-to-gif animation.json --verbose
  $ lottie-to-gif animation.json --dry-run

For more information, visit: https://github.com/anthropics/lottie-tools
  `)
  .action(async (input: string, options: any) => {
    try {
      // Build configuration
      const config: ConversionConfig = {
        input,
        output: options.output,
        fps: options.fps,
        width: options.width,
        height: options.height,
        scaled: options.scaled,
        backgroundColor: options.bg,
        quality: options.quality,
        dither: options.dither,
        timeout: options.timeout,
        verbose: options.verbose,
        dryRun: options.dryRun,
      };

      // Handle repeat/loop options
      if (options.repeat !== undefined) {
        config.repeat = options.repeat;
      } else if (options.loop === false) {
        config.repeat = 0; // No loop
      }

      // Validate configuration
      try {
        validateConfig(config);
      } catch (error) {
        console.error(chalk.red('✗ Configuration error:'), error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
      }

      // Check if input file exists
      if (!fs.existsSync(input)) {
        console.error(chalk.red('✗ Error:'), `Input file not found: ${input}`);
        process.exit(1);
      }

      // Display start message
      const inputBasename = path.basename(input).replace(/\.json$/i, '.gif');
      const outputPath = config.output || path.join('output', inputBasename);
      console.log(chalk.bold('\n🎬 Lottie to GIF Converter\n'));
      console.log(chalk.gray('Input:'), chalk.cyan(input));
      console.log(chalk.gray('Output:'), chalk.cyan(outputPath));
      console.log();

      // Set up progress tracking with Ora
      let spinner: any = null;
      if (options.progress !== false && !options.verbose) {
        spinner = ora('Initializing...').start();
      }

      config.onProgress = (progress) => {
        if (options.progress === false || options.verbose) {
          // Progress disabled or verbose mode (which has its own logging)
          return;
        }

        if (spinner) {
          let message = '';
          switch (progress.phase) {
            case 'parsing':
              message = 'Parsing Lottie file...';
              break;
            case 'rendering':
              if (progress.details?.currentFrame && progress.details?.totalFrames) {
                message = `Rendering frames (${progress.details.currentFrame}/${progress.details.totalFrames})`;
              } else {
                message = 'Rendering animation...';
              }
              break;
            case 'encoding':
              message = 'Encoding to GIF...';
              break;
            case 'complete':
              message = 'Conversion complete!';
              break;
          }
          spinner.text = `${message} ${chalk.gray(`(${progress.percentage.toFixed(0)}%)`)}`;
        }
      };

      // Perform conversion
      const result = await convertLottieToGif(config);

      // Stop spinner
      if (spinner) {
        spinner.succeed(chalk.green('Conversion complete!'));
      }

      // Display results
      console.log();
      console.log(chalk.bold('Results:'));
      console.log(chalk.gray('  Output:'), chalk.cyan(result.outputPath));
      console.log(chalk.gray('  File size:'), chalk.yellow(`${(result.fileSize / 1024).toFixed(2)} KB`));
      console.log(chalk.gray('  Dimensions:'), `${result.output.width}x${result.output.height}`);
      console.log(chalk.gray('  Frame rate:'), `${result.output.frameRate} fps`);
      console.log(chalk.gray('  Frame count:'), result.output.frameCount);
      console.log(chalk.gray('  Total time:'), chalk.magenta(`${(result.totalTime / 1000).toFixed(2)}s`));

      if (options.verbose) {
        console.log();
        console.log(chalk.bold('Timing Breakdown:'));
        console.log(chalk.gray('  Parse:'), `${(result.parseTime / 1000).toFixed(2)}s`);
        console.log(chalk.gray('  Render:'), `${(result.renderTime / 1000).toFixed(2)}s`);
        console.log(chalk.gray('  Encode:'), `${(result.encodeTime / 1000).toFixed(2)}s`);
      }

      console.log();
      console.log(chalk.green('✓ Success!'));
      console.log();

    } catch (error) {
      // Stop spinner if running
      if (options.progress !== false && !options.verbose) {
        const spinner = ora();
        spinner.fail(chalk.red('Conversion failed'));
      }

      console.error();
      console.error(chalk.red('✗ Error:'), error instanceof Error ? error.message : 'Unknown error');

      if (options.verbose && error instanceof Error && error.stack) {
        console.error();
        console.error(chalk.gray('Stack trace:'));
        console.error(chalk.gray(error.stack));
      }

      console.error();
      process.exit(1);
    }
  });

// Parse arguments
program.parse();
